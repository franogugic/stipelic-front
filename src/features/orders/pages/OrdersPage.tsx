import { Download, Filter, Loader2, Search, ShoppingBag, TrendingUp, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { CHART_COLORS } from '../../../shared/ui/chart-colors'
import { getOrderSummary, listOrders } from '../api/orders-api'
import type { Order, OrderStatus, OrderSummary } from '../model/types'

const STATUS_STYLES: Record<string, string> = {
  Paid: 'bg-emerald-500/15 text-emerald-300 light:bg-emerald-50 light:text-emerald-700',
  Pending: 'bg-yellow-500/15 text-yellow-300 light:bg-yellow-50 light:text-yellow-700',
  Failed: 'bg-red-500/15 text-red-300 light:bg-red-50 light:text-red-700',
  Refunded: 'bg-white/10 text-white/50 light:bg-neutral-100 light:text-neutral-500',
}

const STATUS_FILTERS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Refunded', label: 'Refunded' },
]

const PAGE_SIZE = 10

export function OrdersPage() {
  const { slug } = useParams<{ slug: string }>()
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [loadMoreStatus, setLoadMoreStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')

  useEffect(() => {
    if (!slug) return
    listOrders(slug, { limit: PAGE_SIZE })
      .then((page) => { setOrders(page.orders); setHasMore(page.hasMore); setStatus('success') })
      .catch(() => setStatus('error'))
  }, [slug])

  useEffect(() => {
    if (!slug) return
    void getOrderSummary(slug).then(setSummary).catch(() => {})
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

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      const matchesSearch = !q ||
        (o.name?.toLowerCase().includes(q) ?? false) ||
        o.email.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [orders, search, statusFilter])

  // Total/Refunded reflect the currently loaded (keyset) page, same rows shown in the table below —
  // there is no backend aggregate for "all orders" or "all refunds" (only Paid count/revenue are
  // aggregated server-side in OrderSummary), and this chapter is frontend-only so no endpoint was
  // added. The trailing "+" is shown whenever more orders exist beyond what's loaded, so the number
  // never silently underclaims.
  const loadedTotalLabel = `${orders.length}${hasMore ? '+' : ''}`
  const loadedRefundedCount = orders.filter((o) => o.status === 'Refunded').length
  const loadedRefundedLabel = `${loadedRefundedCount}${hasMore ? '+' : ''}`

  const exportCsv = () => {
    const header = ['ID', 'Date', 'Customer', 'Email', 'Product', 'Amount', 'Fee', 'Net', 'Currency', 'Status']
    const rows = filteredOrders.map((o) => [
      o.publicId,
      o.createdAt,
      o.name ?? '',
      o.email,
      o.productName,
      String(o.amountCents / 100),
      String(o.platformFeeCents / 100),
      String(o.netAmountCents / 100),
      o.currency,
      o.status,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell slug={slug!} activeSection="orders">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold leading-none text-white light:text-neutral-950">Orders</h1>
          <p className="mt-1.5 text-sm text-white/40 light:text-neutral-400">
            Your customer orders and transaction history.
          </p>
        </div>

        {summary ? (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-sm">
              <div
                className="mb-2.5 grid size-6 place-items-center rounded-md"
                style={{ backgroundColor: `color-mix(in srgb, ${CHART_COLORS[0]} 15%, transparent)`, color: CHART_COLORS[0] }}
              >
                <ShoppingBag size={13} />
              </div>
              <p
                className="font-data text-xl font-bold tabular-nums text-white light:text-neutral-950"
                title={hasMore ? 'More orders exist beyond the currently loaded page' : undefined}
              >
                {loadedTotalLabel}
              </p>
              <p className="mt-1 text-xs text-white/40 light:text-neutral-400">Total orders</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-sm">
              <div
                className="mb-2.5 grid size-6 place-items-center rounded-md"
                style={{ backgroundColor: `color-mix(in srgb, ${CHART_COLORS[1]} 15%, transparent)`, color: CHART_COLORS[1] }}
              >
                <ShoppingBag size={13} />
              </div>
              <p className="font-data text-xl font-bold tabular-nums text-white light:text-neutral-950">{summary.paidOrderCount}</p>
              <p className="mt-1 text-xs text-white/40 light:text-neutral-400">Paid orders</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-sm">
              <div
                className="mb-2.5 grid size-6 place-items-center rounded-md"
                style={{ backgroundColor: `color-mix(in srgb, ${CHART_COLORS[3]} 15%, transparent)`, color: CHART_COLORS[3] }}
              >
                <TrendingUp size={13} />
              </div>
              <p className="font-data text-xl font-bold tabular-nums text-white light:text-neutral-950">
                {formatMoney(summary.totalPaidAmountCents, summary.currency ?? 'EUR')}
              </p>
              <p className="mt-1 text-xs text-white/40 light:text-neutral-400">Revenue</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-sm">
              <div
                className="mb-2.5 grid size-6 place-items-center rounded-md"
                style={{ backgroundColor: `color-mix(in srgb, ${CHART_COLORS[4]} 15%, transparent)`, color: CHART_COLORS[4] }}
              >
                <XCircle size={13} />
              </div>
              <p
                className="font-data text-xl font-bold tabular-nums text-white light:text-neutral-950"
                title={hasMore ? 'More orders exist beyond the currently loaded page' : undefined}
              >
                {loadedRefundedLabel}
              </p>
              <p className="mt-1 text-xs text-white/40 light:text-neutral-400">Refunded</p>
            </div>
          </div>
        ) : null}

        {status === 'success' && orders.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 light:text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer or product…"
                className="h-10 w-full rounded-xl border border-border bg-secondary pl-9 pr-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:text-neutral-950 light:placeholder-neutral-400"
              />
            </div>
            <div className="relative">
              <Filter size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30 light:text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
                className="h-10 rounded-xl border border-border bg-secondary py-0 pl-8 pr-8 text-sm text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:text-neutral-950"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-white/70 transition hover:bg-secondary light:text-neutral-600"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        )}

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

        {status === 'success' && filteredOrders.length === 0 && orders.length > 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Search size={32} className="text-white/15 light:text-neutral-300" />
            <p className="text-sm text-white/40 light:text-neutral-400">No orders match your search.</p>
          </div>
        )}

        {status === 'success' && filteredOrders.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left text-[11px] font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Fee</th>
                  <th className="px-5 py-3">Net</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.publicId} className="transition hover:bg-secondary">
                    <td className="px-5 py-3.5 font-mono text-xs text-white/40 light:text-neutral-400" title={order.publicId}>
                      {order.publicId.slice(0, 8)}
                    </td>
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
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-white/70 transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 light:text-neutral-600"
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
