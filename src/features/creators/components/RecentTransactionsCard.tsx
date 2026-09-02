import { ArrowUpRight } from 'lucide-react'
import { OrderStatusBadge } from '../../orders/components/OrderStatusBadge'
import type { Order } from '../../orders/model/types'

type RecentTransactionsCardProps = {
  orders: Order[]
  onViewAll: () => void
}

export function RecentTransactionsCard({ orders, onViewAll }: RecentTransactionsCardProps) {
  return (
    <div className="col-span-2 rounded-xl bg-card p-5" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold">Recent Transactions</p>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-chart-1)' }}
        >
          View all <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="space-y-3.5">
        {orders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No paid orders yet.</p>
        ) : (
          orders.slice(0, 5).map((order) => (
            <div key={order.publicId} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate max-w-[130px]">
                  {order.name ?? order.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{order.productName}</p>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <p className="text-xs font-mono text-foreground">{formatCurrency(order.amountCents, order.currency)}</p>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function formatCurrency(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}
