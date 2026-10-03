import { date, initials, money } from '../../../shared/lib/format'
import { Avatar, Money, StatusBadge } from '../../../shared/ui/ledger'
import type { Order } from '../model/types'

/**
 * Orders in the prototype's ordersTable() layout. `compact` (dashboard) drops the landing page, fee and
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
                  Fee
                </th>
                <th scope="col" className="is-num">
                  Net
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const name = order.name?.trim() || null
            return (
              <tr key={order.publicId}>
                <td className="is-lead">
                  <div className="table__main">
                    <Avatar size="sm" neutral>
                      {initials(name ?? order.email)}
                    </Avatar>
                    <div>
                      <span className="table__primary">{name ?? order.email}</span>
                      {name && <span className="table__secondary">{order.email}</span>}
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
                    <td data-label="Fee" className="is-num text-muted">
                      −{money(order.platformFeeCents, order.currency)}
                    </td>
                    <td data-label="Net" className="is-num">
                      <Money amountCents={order.netAmountCents} currency={order.currency} />
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
