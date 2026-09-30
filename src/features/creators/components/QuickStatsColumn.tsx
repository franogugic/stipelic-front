import { Percent, Wallet } from 'lucide-react'

type QuickStatsColumnProps = {
  avgOrderValueCents: number | null
  totalPlatformFeeCents: number
  currency: string
}

export function QuickStatsColumn({ avgOrderValueCents, totalPlatformFeeCents, currency }: QuickStatsColumnProps) {
  return (
    <div className="col-span-1 flex flex-col gap-3">
      <MiniStat
        icon={Wallet}
        color="var(--color-chart-1)"
        label="Avg. Purchase"
        value={avgOrderValueCents != null ? formatCurrency(avgOrderValueCents, currency) : '—'}
      />
      <MiniStat
        icon={Percent}
        color="var(--color-chart-4)"
        label="Platform Fee"
        value={formatCurrency(totalPlatformFeeCents, currency)}
      />
    </div>
  )
}

function MiniStat({
  icon: Icon,
  color,
  label,
  value,
  sub,
}: {
  icon: typeof Wallet
  color: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <div
      className="relative flex-1 overflow-hidden rounded-xl bg-card p-4"
      style={{
        border: '1px solid rgba(255,255,255,0.07)',
        background: `linear-gradient(135deg, color-mix(in srgb, ${color} 10%, transparent), transparent 65%), var(--color-card)`,
      }}
    >
      <div
        className="mb-2.5 grid size-7 place-items-center rounded-md"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
      >
        <Icon size={14} />
      </div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-foreground" style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.3rem' }}>
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function formatCurrency(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}
