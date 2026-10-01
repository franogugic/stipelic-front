import type { LucideIcon } from 'lucide-react'

/** The big state illustration above a solo screen's title: an icon with an optional corner badge. */
export function StateArt({
  icon: Icon,
  badge: Badge,
  tone,
}: {
  icon: LucideIcon
  badge?: LucideIcon
  tone?: 'state--error'
}) {
  return (
    <div className={['state', tone, 'solo__art'].filter(Boolean).join(' ')}>
      <div className="state__art">
        <Icon />
        {Badge && (
          <span className="state__badge">
            <Badge />
          </span>
        )}
      </div>
    </div>
  )
}
