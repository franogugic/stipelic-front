import type { ReactNode } from 'react'

/** Input with attached addons: put `InputAddon`s and an `Input` inside, in visual order. */
export function InputGroup({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={['input-group', className].filter(Boolean).join(' ')}>{children}</div>
}

/** `plain` drops the addon's own background (for a button inside the group). */
export function InputAddon({ plain, children }: { plain?: boolean; children: ReactNode }) {
  return <span className={['input-group__addon', plain && 'input-group__addon--plain'].filter(Boolean).join(' ')}>{children}</span>
}
