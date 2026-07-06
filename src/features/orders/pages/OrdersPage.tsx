import { Loader2, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { listOrders } from '../api/orders-api'
import type { Order } from '../model/types'

const STATUS_STYLES: Record<string, string> = {
  Paid: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-yellow-50 text-yellow-700',
  Failed: 'bg-red-50 text-red-700',
  Refunded: 'bg-neutral-100 text-neutral-500',
}

export function OrdersPage() {
  const { slug } = useParams<{ slug: string }>()
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!slug) return
    listOrders(slug)
      .then((data) => { setOrders(data); setStatus('success') })
      .catch(() => setStatus('error'))
  }, [slug])

  return (
    <AppShell slug={slug!} activeSection="orders">
      <div className="p-8">
        <div className="mb-6 flex items-center gap-3">
          <ShoppingBag size={22} className="text-neutral-950" />
          <h1 className="text-xl font-semibold text-neutral-950">Orders</h1>
        </div>

        {status === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-neutral-400" size={24} />
          </div>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-500">Failed to load orders. Please try again.</p>
        )}

        {status === 'success' && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <ShoppingBag size={32} className="text-neutral-300" />
            <p className="text-sm text-neutral-400">No orders yet.</p>
          </div>
        )}

        {status === 'success' && orders.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order.publicId} className="bg-white hover:bg-neutral-50 transition">
                    <td className="px-5 py-3.5 text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-neutral-950">{order.name ?? '—'}</p>
                      <p className="text-xs text-neutral-400">{order.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-700">{order.productName}</td>
                    <td className="px-5 py-3.5 font-medium text-neutral-950">
                      {(order.amountCents / 100).toLocaleString(undefined, {
                        style: 'currency', currency: order.currency,
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
