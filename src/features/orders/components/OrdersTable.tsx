import { Download, Link2Off } from 'lucide-react'
import { date, initials, number, plural } from '../../../shared/lib/format'
import { Avatar, Money, StatusBadge } from '../../../shared/ui/ledger'
import type { Order } from '../model/types'

/** How often the buyer used their personal link — and "Link off" once the order was refunded. */
function Downloads({ order }: { order: Order }) {
  if (order.status !== 'Paid' && order.status !== 'Refunded') {
    return (
      <span className="text-muted" data-tooltip="No download link until the order is paid" tabIndex={0}>
        —
      </span>
    )
  }
  const done = `Downloaded ${plural(order.downloadCount, 'time')}`
  if (order.status === 'Refunded') {
    return (
      <span className="order-uses order-uses--off" data-tooltip={`Refunded, so the buyer’s link is off. ${done} before that.`} tabIndex={0}>
        <Link2Off />
        Link off
      </span>
    )
  }
  return (
    <span className="order-uses" data-tooltip={done} tabIndex={0} aria-label={done}>
      <Download />
      <span className="num">{number(order.downloadCount)}</span>
    </span>
  )
}

/**
 * Orders in the prototype's ordersTable() layout. `compact` (dashboard) drops the landing page and
 * net columns. Rows stack into labelled blocks on narrow screens (`table--stack`).
 */
export function OrdersTable({ orders, compact = false }: { orders: Order[]; compact?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="table table--stack">
        <thead>
          <tr>
            <th scope="col">Customer</th>
            <th scope="col">Product</th>
            {!compact && <th scope="col">Landing page</th>}
            <th scope="col">Date</th>
            <th scope="col">Status</th>
            <th scope="col" className="is-num">
              Amount
            </th>
            {!compact && (
              <>
                <th scope="col" className="is-num">
                  Net
                </th>
                <th scope="col">Downloads</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const name = order.name?.trim() || null
            const email = order.email ?? '—'
            return (
              <tr key={order.publicId}>
                <td className="is-lead">
                  <div className="table__main">
                    <Avatar size="sm" neutral>
                      {initials(name ?? order.email ?? '?')}
                    </Avatar>
                    <div>
                      <span className="table__primary">{name ?? email}</span>
                      {name && <span className="table__secondary">{email}</span>}
                    </div>
                  </div>
                </td>
                <td data-label="Product">{order.productName}</td>
                {!compact && (
                  <td data-label="Page" className="text-secondary">
                    {order.landingPageTitle ?? '—'}
                  </td>
                )}
                <td data-label="Date" className="num">
                  {date(order.createdAt)}
                </td>
                <td data-label="Status">
                  <StatusBadge kind="order" value={order.status.toLowerCase()} />
                </td>
                <td data-label="Amount" className="is-num">
                  <Money amountCents={order.amountCents} currency={order.currency} />
                </td>
                {!compact && (
                  <>
                    <td data-label="Net" className="is-num">
                      <Money amountCents={order.netAmountCents} currency={order.currency} />
                    </td>
                    <td data-label="Downloads">
                      <Downloads order={order} />
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
