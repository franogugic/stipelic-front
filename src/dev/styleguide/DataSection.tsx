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

// Specimen data, read from the running prototype's styleguide. The sparkline values are scaled so the
// curve renders the same path as the prototype's; only its shape is visible.
const MONTHLY_REVENUE_CENTS = [0, 38014, 0, 29606, 33363, 41239, 32326, 37112, 51076, 60000, 59092, 56382]
const TOTAL_CENTS = 468500
const THIS_MONTH_CENTS = 54400
const LAST_MONTH_CENTS = 56500
const CHANGE = -3.7

const BADGES: Array<[string, StatusKind, string[]]> = [
  ['Orders', 'order', ['paid', 'pending', 'failed', 'refunded']],
  ['Landing pages', 'page', ['published', 'draft', 'archived']],
  ['Products', 'product', ['active', 'draft', 'archived']],
  ['Campaigns', 'campaign', ['sent', 'sending', 'scheduled', 'failed', 'cancelled']],
  ['Payouts', 'payout', ['pending', 'paid', 'failed', 'cancelled']],
  ['Subscribers', 'subscriber', ['active', 'unsubscribed']],
  ['Subscription', 'subscription', ['active', 'unpaid', 'past_due', 'cancelling']],
]

// Newest first, like the prototype's mock orders; the footer totals come from ORDER_TOTALS.
const ORDERS = [
  { id: 1, number: 1072, name: 'Teodora Kovač', email: 'teodora.kovac@gmail.com', product: 'Freelance OS for Notion', createdAt: '2026-09-26T12:00:00', status: 'pending', cents: 3900 },
  { id: 2, number: 1071, name: 'Dunja Mehmedović', email: 'dunja_mehmedovic@bih.net.ba', product: 'Adriatic Summer Presets', createdAt: '2026-09-25T12:00:00', status: 'refunded', cents: 2900 },
  { id: 3, number: 1070, name: 'Borna Rakić', email: 'b.rakic@yahoo.com', product: 'Brand Identity Masterclass', createdAt: '2026-09-23T12:00:00', status: 'paid', cents: 14900 },
  { id: 4, number: 1069, name: 'Klara Mitrović', email: 'klara.mitrovic3@mts.rs', product: 'Adriatic Summer Presets', createdAt: '2026-09-22T12:00:00', status: 'paid', cents: 2900 },
  { id: 5, number: 1068, name: 'Stefan Jovanović', email: 'stefan_jovanovic@icloud.com', product: 'Adriatic Summer Presets', createdAt: '2026-09-18T12:00:00', status: 'paid', cents: 2900 },
  { id: 6, number: 1067, name: 'Borna Tomić', email: 'borna.tomic6@siol.net', product: 'Brand Identity Masterclass', createdAt: '2026-09-17T12:00:00', status: 'paid', cents: 14900 },
  { id: 7, number: 1066, name: 'Ana Vidović', email: 'ana.vidovic@siol.net', product: 'Brand Identity Masterclass', createdAt: '2026-09-12T12:00:00', status: 'paid', cents: 14900 },
  { id: 8, number: 1036, name: 'Amir Ilić', email: 'amir.ilic@gmail.com', product: '1:1 Portfolio Review', createdAt: '2026-05-17T12:00:00', status: 'refunded', cents: 9000 },
  { id: 9, number: 1030, name: 'Marija Radić', email: 'marija.radic4@gmail.com', product: 'Adriatic Summer Presets', createdAt: '2026-04-19T12:00:00', status: 'failed', cents: 2900 },
  { id: 10, number: 1024, name: 'Nina Stojanović', email: 'ninastojanovic81@icloud.com', product: '1:1 Portfolio Review', createdAt: '2026-03-05T12:00:00', status: 'refunded', cents: 9000 },
]

// How many orders each tab matches in the full data set (the list above is only the first page).
const ORDER_TOTALS: Record<string, number> = { all: 72, paid: 63, other: 9 }

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
  const previousMonth = new Date(2026, 7, 1)

  return (
    <section className="section" id="data" aria-labelledby="data-title">
      <div className="section__header">
        <div className="stack stack--xs">
          <h2 className="section-title" id="data-title">
            Data display
          </h2>
          <p>Metrics, badges, meters and tables — all figures below are computed from the mock data.</p>
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
        <Metric label="Average order value" icon={Receipt} value={<Money amountCents={7437} />} meta={plural(63, 'paid order')} />
        <Metric
          label="Active subscribers"
          icon={Users}
          value={number(124)}
          meta={
            <>
              <Delta change={1}>{number(16)}</Delta> new this month
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
            <Meter label="Landing pages" used={5} limit={20} />
            <Meter label="Products" used={5} limit={25} />
            <Meter label="Emails this month" used={207} limit={5000} />
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
          <TableFooter count={`Showing ${rows.length} of ${plural(ORDER_TOTALS[tabs.active], 'order')}`} />
        </TabPanel>
      </div>
    </section>
  )
}
