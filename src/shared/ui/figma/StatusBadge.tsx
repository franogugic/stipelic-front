const BLUE = 'var(--color-chart-1)'
const AMBER = 'var(--color-chart-5)'
const SALMON = 'var(--color-chart-4)'
const GREY = 'var(--color-muted-foreground)'

const STATUS_COLORS: Record<string, string> = {
  live: BLUE,
  draft: GREY,
  active: BLUE,
  paused: AMBER,
  completed: BLUE,
  pending: AMBER,
  refunded: SALMON,
  unsubscribed: SALMON,
  scheduled: AMBER,
  sent: BLUE,
  failed: SALMON,
  cancelled: GREY,
  paid: BLUE,
  archived: GREY,
}

export function StatusBadge({
  status,
  label,
  className = '',
}: {
  status: string
  label?: string
  className?: string
}) {
  const color = STATUS_COLORS[status.toLowerCase()] ?? GREY
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-mono ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 13%, transparent)`,
      }}
    >
      {label ?? status}
    </span>
  )
}
