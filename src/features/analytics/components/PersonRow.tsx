import type { ReactNode } from 'react'
import { initials } from '../../../shared/lib/format'
import { Avatar } from '../../../shared/ui/ledger'

/** Avatar row used by the analytics lists (latest sales, sign-ups, orders). */
export function PersonRow({ name, email, children }: { name: string; email?: string | null; children: ReactNode }) {
  return (
    <div className="list__row">
      <Avatar size="sm" neutral>
        {initials(name)}
      </Avatar>
      <div className="list__grow person">
        <span className="table__primary">{name}</span>
        {email ? <span className="table__secondary">{email}</span> : null}
      </div>
      <div className="person__end">{children}</div>
    </div>
  )
}
