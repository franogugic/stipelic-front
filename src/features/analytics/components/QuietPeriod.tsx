import { CalendarRange, ChartNoAxesCombined } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState } from '../../../shared/ui/ledger'
import type { AnalyticsPeriod } from '../model/types'

/** Said when the chosen period has nothing to show, with a way to widen it to all time. */
export function QuietPeriod({
  period,
  icon = ChartNoAxesCombined,
  title,
  text,
  onShowAll,
}: {
  period: AnalyticsPeriod
  icon?: LucideIcon
  title: ReactNode
  text: ReactNode
  onShowAll: () => void
}) {
  return (
    <EmptyState
      compact
      icon={icon}
      title={title}
      text={text}
      action={period === 'all' ? undefined : { label: 'Show all time', icon: CalendarRange, variant: 'secondary', onClick: onShowAll }}
    />
  )
}
