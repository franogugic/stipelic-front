import { Badge } from './Badge'
import { FileDown, Gift } from 'lucide-react'
import { PAGE_TYPES, STATUS } from './status'
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

/** The format of a product's document ("PDF", "EPUB", "ZIP"). */
export function FileTypeBadge({ format }: { format: string }) {
  return (
    <Badge tone="outline" icon={FileDown}>
      {format}
    </Badge>
  )
}

/** A product given away for an email on lead pages, not sold. */
export function FreeBadge() {
  return (
    <Badge tone="accent" icon={Gift}>
      Free
    </Badge>
  )
}
