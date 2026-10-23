import { CalendarRange, ChartNoAxesCombined } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '../../../shared/ui/ledger'
import type { AnalyticsPeriod } from '../model/types'
import { useWorkspaceHasHistory } from '../model/use-workspace-history'

/** Said when the chosen period has nothing to show, with a way to widen it to all time (not offered in a workspace where nothing ever happened). */
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
  const { slug } = useParams<{ slug: string }>()
  const hasHistory = useWorkspaceHasHistory(slug)
  return (
    <EmptyState
      compact
      icon={icon}
      title={title}
      text={text}
      action={period === 'all' || !hasHistory ? undefined : { label: 'Show all time', icon: CalendarRange, variant: 'secondary', onClick: onShowAll }}
    />
  )
}
