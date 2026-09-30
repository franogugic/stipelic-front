import { Badge } from './Badge'
import { PAGE_TYPES, PRODUCT_TYPES, STATUS } from './status'
import type { StatusKind } from './status'

/** `kind` + a prototype key (see the *StatusKey mappers in status.ts). Unknown keys render a plain badge. */
export function StatusBadge({ kind, value, label }: { kind: StatusKind; value: string; label?: string }) {
  const entry = STATUS[kind][value]
  if (!entry) return <span className="badge">{value}</span>
  const [tone, text, live] = entry
  return (
    <Badge tone={tone} dot live={live}>
      {label ?? text}
    </Badge>
  )
}

export function PageTypeBadge({ type }: { type: string }) {
  const entry = PAGE_TYPES[type]
  if (!entry) return <span className="badge">{type}</span>
  const [tone, text, Icon] = entry
  return (
    <Badge tone={tone} icon={Icon}>
      {text}
    </Badge>
  )
}

export function ProductTypeBadge({ type }: { type: string }) {
  const entry = PRODUCT_TYPES[type]
  if (!entry) return <span className="badge">{type}</span>
  const [text, Icon] = entry
  return (
    <Badge tone="outline" icon={Icon}>
      {text}
    </Badge>
  )
}
