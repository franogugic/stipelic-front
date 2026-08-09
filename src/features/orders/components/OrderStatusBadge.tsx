import type { OrderStatus } from '../model/types'

// Matches Figma's own StatusBadge (App.tsx ~line 145) exactly — it never uses semantic green/red for
// any status anywhere in the app, it recycles the same chart-1..5 palette everywhere. Paid maps to
// Figma's "completed" (blue), Pending → "pending" (amber), Refunded → "refunded" (salmon). "Failed"
// has no Figma equivalent in that map, so it gets the same neutral fallback Figma itself uses for an
// unmapped status, rather than inventing a color Figma doesn't have.
const STATUS_STYLES: Record<OrderStatus, { bg: string; color: string }> = {
  Paid: { bg: 'color-mix(in srgb, var(--color-chart-1) 12%, transparent)', color: 'var(--color-chart-1)' },
  Pending: { bg: 'color-mix(in srgb, var(--color-chart-5) 12%, transparent)', color: 'var(--color-chart-5)' },
  Refunded: { bg: 'color-mix(in srgb, var(--color-chart-4) 12%, transparent)', color: 'var(--color-chart-4)' },
  Failed: { bg: 'rgba(255,255,255,0.08)', color: 'var(--color-muted-foreground)' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLES[status] ?? { bg: 'rgba(255,255,255,0.08)', color: 'var(--color-muted-foreground)' }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-mono"
      style={{
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`,
      }}
    >
      {status}
    </span>
  )
}
