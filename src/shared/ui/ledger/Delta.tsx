import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { percent } from '../../lib/format'

/**
 * Change indicator. `change` is a percentage: > 0 up, < 0 down, 0 flat (drawn like "up", as in the
 * prototype). Children replace the default "12.5%" text (e.g. "+3").
 */
export function Delta({ change, children }: { change: number; children?: ReactNode }) {
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  const Icon = change >= 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`delta delta--${direction}`}>
      <Icon />
      {children ?? percent(Math.abs(change))}
    </span>
  )
}
