import { Calendar } from 'lucide-react'
import { Menu } from '../../../shared/ui/ledger'
import { PERIODS } from '../model/series'
import type { AnalyticsPeriod } from '../model/types'

/** The period menu — the same eight options on every chart. */
export function PeriodMenu({
  period,
  onPeriod,
  align = 'start',
  triggerClassName,
}: {
  period: AnalyticsPeriod
  onPeriod: (period: AnalyticsPeriod) => void
  align?: 'start' | 'end'
  triggerClassName?: string
}) {
  const current = PERIODS.find((candidate) => candidate.id === period) ?? PERIODS[1]
  return (
    <Menu
      label="Period"
      triggerIcon={Calendar}
      triggerLabel={current.label}
      caret
      align={align}
      triggerClassName={triggerClassName}
      items={PERIODS.map((option) => ({
        label: option.label,
        checked: option.id === period,
        onSelect: () => onPeriod(option.id),
      }))}
    />
  )
}
