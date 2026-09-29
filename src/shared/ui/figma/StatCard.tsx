import { Card } from './Card'

export function StatCard({
  label,
  value,
  sub,
  color,
  className = '',
}: {
  label: string
  value: string
  sub?: string
  color?: string
  className?: string
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2.5">{label}</p>
      <p
        className="font-bold leading-none mb-1.5"
        style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.55rem', color: color ?? 'var(--color-foreground)' }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  )
}
