import type { ReactNode } from 'react'
import { Button } from './Button'

/** Under a table: an optional "Load more" button and the "Showing 12 of 48" text. */
export function TableFooter({
  count,
  onLoadMore,
  loading,
}: {
  count: ReactNode
  /** Without it no button is shown (everything is already loaded). */
  onLoadMore?: () => void
  loading?: boolean
}) {
  return (
    <div className="table-footer">
      {onLoadMore && (
        <Button variant="secondary" loading={loading} onClick={onLoadMore}>
          Load more
        </Button>
      )}
      <span className="table-footer__count">{count}</span>
    </div>
  )
}
