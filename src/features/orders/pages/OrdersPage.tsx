import { Download, Loader2, Search, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { Dropdown } from '../../../shared/ui/Dropdown'
import { useProductStore } from '../../products/model/product-store'
import { listOrders } from '../api/orders-api'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import type { Order, OrderStatus } from '../model/types'

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Refunded', label: 'Refunded' },
]

export function OrdersPage() {
  const { slug } = useParams<{ slug: string }>()
  const products = useProductStore((s) => s.products)
  const loadProducts = useProductStore((s) => s.loadProducts)
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [loadMoreStatus, setLoadMoreStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')

  useEffect(() => {
    if (slug) void loadProducts(slug)
  }, [slug, loadProducts])

  // Product/status are real server-side filters (narrow the full order set, not just the loaded
  // page), so changing either re-runs the query from the start — same as a fresh mount.
  useEffect(() => {
    if (!slug) return
    let isCurrent = true

    async function run() {
      setStatus('loading')
      try {
        const page = await listOrders(slug!, {
          productId: productFilter === 'all' ? undefined : productFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: PAGE_SIZE,
        })
        if (!isCurrent) return
        setOrders(page.orders)
        setHasMore(page.hasMore)
        setStatus('success')
      } catch {
        if (isCurrent) setStatus('error')
      }
    }

    void run()
    return () => { isCurrent = false }
  }, [slug, productFilter, statusFilter])

  const loadMore = () => {
    if (!slug || orders.length === 0) return
    const last = orders[orders.length - 1]
    setLoadMoreStatus('loading')
    listOrders(slug, {
      productId: productFilter === 'all' ? undefined : productFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      afterCreatedAt: last.createdAt,
      afterId: last.publicId,
      limit: PAGE_SIZE,
    })
      .then((page) => {
        setOrders((prev) => [...prev, ...page.orders])
        setHasMore(page.hasMore)
        setLoadMoreStatus('idle')
      })
      .catch(() => setLoadMoreStatus('error'))
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((o) =>
      (o.name?.toLowerCase().includes(q) ?? false) ||
      o.email.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q)
    )
  }, [orders, search])

  const productOptions = useMemo(
    () => [{ value: 'all', label: 'All products' }, ...products.map((p) => ({ value: p.publicId, label: p.name }))],
    [products],
  )

  const exportCsv = () => {
    const header = ['ID', 'Date', 'Customer', 'Email', 'Product', 'Landing Page', 'Amount', 'Fee', 'Net', 'Currency', 'Status']
    const rows = filteredOrders.map((o) => [
      o.publicId,
      o.createdAt,
      o.name ?? '',
      o.email,
      o.productName,
      o.landingPageTitle ?? '',
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
        <PageHeader title="Orders" subtitle="All purchases across your products and landing pages." />

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or product…"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground/40 focus:outline-none border border-border"
            />
          </div>
          <Dropdown value={productFilter} onChange={setProductFilter} options={productOptions} className="w-44" />
          <Dropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} className="w-40" />
          <GhostBtn onClick={exportCsv}>
            <Download size={13} /> Export
          </GhostBtn>
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
            <p className="text-sm text-white/40 light:text-neutral-400">No orders match these filters.</p>
          </div>
        )}

        {status === 'success' && filteredOrders.length === 0 && orders.length > 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Search size={32} className="text-white/15 light:text-neutral-300" />
            <p className="text-sm text-white/40 light:text-neutral-400">No orders match your search.</p>
          </div>
        )}

        {status === 'success' && filteredOrders.length > 0 && (
          <Card>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['ID', 'Date', 'Customer', 'Product', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.publicId} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3.5 text-[11px] font-mono text-muted-foreground" title={order.publicId}>
                      {order.publicId.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-sm">{order.name ?? order.email}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {order.productName}
                      {order.landingPageTitle ? (
                        <p className="text-[10px] text-muted-foreground/70">via {order.landingPageTitle}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono font-semibold" style={{ color: 'var(--color-chart-1)' }}>
                      {formatMoney(order.amountCents, order.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {status === 'success' && hasMore && (
          <div className="mt-6 flex justify-center">
            <GhostBtn onClick={loadMore} disabled={loadMoreStatus === 'loading'} className="px-4 py-2">
              {loadMoreStatus === 'loading' ? <Loader2 className="animate-spin" size={14} /> : null}
              Load more
            </GhostBtn>
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

/* ─── Helpers ──────────────────────────────────────────────────── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card ${className}`}>{children}</div>
}

function GhostBtn({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-bold leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2rem' }}>
        {title}
      </h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
    </div>
  )
}

function formatMoney(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, { style: 'currency', currency })
}
