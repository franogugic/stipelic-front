import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Search plus a status filter with counts — the table version of the filter bar (`.filter-bar--table`), which sits at
 * the top of a card above a table. Controlled.
 */
export function TableFilterBar({
  noun,
  statuses,
  status,
  count,
  onStatus,
  query,
  onQuery,
  maxLength,
  extra,
}: {
  /** What the search looks for: "campaigns" → "Search campaigns". */
  noun: string
  statuses: Array<[key: string, label: string]>
  status: string
  count: (key: string) => number
  onStatus: (key: string) => void
  query: string
  onQuery: (value: string) => void
  maxLength?: number
  /** Extra controls on the right (a product select). */
  extra?: ReactNode
}) {
  return (
    <div className="filter-bar filter-bar--table">
      <div className="search filter-bar__search">
        <Search />
        <input
          className="input"
          type="search"
          placeholder={`Search ${noun}`}
          aria-label={`Search ${noun}`}
          maxLength={maxLength}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
      </div>
      <div className="segmented" role="radiogroup" aria-label="Status">
        {statuses.map(([key, label]) => (
          <label className="segmented__option" key={key}>
            <input type="radio" name="filter-status" value={key} checked={status === key} onChange={() => onStatus(key)} />
            <span className="segmented__label">
              {label}
              <span className="tab__count">{count(key)}</span>
            </span>
          </label>
        ))}
      </div>
      {extra}
    </div>
  )
}
