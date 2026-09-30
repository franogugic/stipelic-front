import { Fragment } from 'react'
import type { ReactNode } from 'react'

/** Details list. Each pair is [term, description]; pass `mono` per pair for technical values. */
export function KeyValue({ items }: { items: Array<{ term: ReactNode; description: ReactNode; mono?: boolean }> }) {
  return (
    <dl className="kv">
      {items.map((item, index) => (
        <Fragment key={index}>
          <dt>{item.term}</dt>
          <dd className={item.mono ? 'mono' : undefined}>{item.description}</dd>
        </Fragment>
      ))}
    </dl>
  )
}
