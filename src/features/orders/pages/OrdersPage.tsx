import { Loader2, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { listOrders } from '../api/orders-api'
import type { Order } from '../model/types'

const STATUS_STYLES: Record<string, string> = {
  Paid: 'bg-emerald-500/15 text-emerald-300 light:bg-emerald-50 light:text-emerald-700',
  Pending: 'bg-yellow-500/15 text-yellow-300 light:bg-yellow-50 light:text-yellow-700',
  Failed: 'bg-red-500/15 text-red-300 light:bg-red-50 light:text-red-700',
  Refunded: 'bg-white/10 text-white/50 light:bg-neutral-100 light:text-neutral-500',
}

const PAGE_SIZE = 10

export function OrdersPage() {
  const { slug } = useParams<{ slug: string }>()
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [loadMoreStatus, setLoadMoreStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  useEffect(() => {
    if (!slug) return
    listOrders(slug, { limit: PAGE_SIZE })
      .then((page) => { setOrders(page.orders); setHasMore(page.hasMore); setStatus('success') })
      .catch(() => setStatus('error'))
  }, [slug])

  const loadMore = () => {
    if (!slug || orders.length === 0) return
    const last = orders[orders.length - 1]
    setLoadMoreStatus('loading')
    listOrders(slug, { afterCreatedAt: last.createdAt, afterId: last.publicId, limit: PAGE_SIZE })
      .then((page) => {
        setOrders((prev) => [...prev, ...page.orders])
        setHasMore(page.hasMore)
        setLoadMoreStatus('idle')
      })
      .catch(() => setLoadMoreStatus('error'))
  }

  return (
    <AppShell slug={slug!} activeSection="orders">
      <div className="p-8">
        <div className="mb-6 flex items-center gap-3">
          <ShoppingBag size={22} className="text-white light:text-neutral-950" />
          <h1 className="text-xl font-semibold text-white light:text-neutral-950">Orders</h1>
        </div>

        {status === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-white/40 light:text-neutral-400" size={24} />
          </div>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-400 light:text-red-500">Failed to load orders. Please try again.</p>
        )}

        {status === 'success' && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <ShoppingBag size={32} className="text-white/15 light:text-neutral-300" />
            <p className="text-sm text-white/40 light:text-neutral-400">No orders yet.</p>
          </div>
        )}

        {status === 'success' && orders.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm light:border-neutral-200 light:bg-transparent">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs font-medium uppercase tracking-wider text-white/40 light:border-neutral-200 light:bg-neutral-50 light:text-neutral-400">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Fee</th>
                  <th className="px-5 py-3">Net</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 light:divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order.publicId} className="transition hover:bg-white/[0.04] light:bg-white light:hover:bg-neutral-50">
                    <td className="px-5 py-3.5 text-white/50 light:text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white light:text-neutral-950">{order.name ?? '—'}</p>
                      <p className="text-xs text-white/40 light:text-neutral-400">{order.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-white/70 light:text-neutral-700">{order.productName}</td>
                    <td className="font-data px-5 py-3.5 font-medium tabular-nums text-white light:text-neutral-950">
                      {formatMoney(order.amountCents, order.currency)}
                    </td>
                    <td className="font-data px-5 py-3.5 tabular-nums text-white/50 light:text-neutral-500">
                      {formatMoney(order.platformFeeCents, order.currency)}
                    </td>
                    <td className="font-data px-5 py-3.5 font-medium tabular-nums text-white light:text-neutral-950">
                      {formatMoney(order.netAmountCents, order.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] ?? 'bg-white/10 text-white/50 light:bg-neutral-100 light:text-neutral-500'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {status === 'success' && hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              disabled={loadMoreStatus === 'loading'}
              onClick={loadMore}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 light:border-neutral-200 light:bg-white light:text-neutral-600 light:hover:bg-neutral-50"
            >
              {loadMoreStatus === 'loading' ? <Loader2 className="animate-spin" size={14} /> : null}
              Load more
            </button>
          </div>
        )}

        {loadMoreStatus === 'error' && (
          <p className="mt-3 text-center text-sm text-red-400 light:text-red-500">
            Failed to load more orders. Please try again.
          </p>
        )}
      </div>
    </AppShell>
  )
}

function formatMoney(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, { style: 'currency', currency })
}
