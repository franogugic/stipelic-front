import { LayoutGrid, List, Search } from 'lucide-react'
import { Switch } from './Switch'

export type FilterView = 'grid' | 'list'

/**
 * Search, a type filter with counts, "Show archived" and the grid / list switch — the prototype's `filterBar()`, shared
 * by the collections (landing pages, products). Controlled; the page keeps the values (usually in the URL).
 */
export function FilterBar({
  noun,
  types,
  type,
  count,
  onType,
  query,
  onQuery,
  showArchived,
  onShowArchived,
  view,
  onView,
}: {
  /** Plural noun for the search box: "pages" → "Search pages". */
  noun: string
  types: Array<[key: string, label: string]>
  type: string
  count: (key: string) => number
  onType: (key: string) => void
  query: string
  onQuery: (value: string) => void
  showArchived: boolean
  onShowArchived: (value: boolean) => void
  view: FilterView
  onView: (view: FilterView) => void
}) {
  return (
    <div className="filter-bar">
      <div className="search filter-bar__search">
        <Search />
        <input
          className="input"
          type="search"
          placeholder={`Search ${noun}`}
          aria-label={`Search ${noun}`}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
      </div>
      <div className="segmented" role="radiogroup" aria-label="Type">
        {types.map(([key, label]) => (
          <label className="segmented__option" key={key}>
            <input type="radio" name="filter-type" value={key} checked={type === key} onChange={() => onType(key)} />
            <span className="segmented__label">
              {label}
              <span className="tab__count">{count(key)}</span>
            </span>
          </label>
        ))}
      </div>
      <Switch label="Show archived" checked={showArchived} onChange={(event) => onShowArchived(event.target.checked)} />
      <div className="segmented filter-bar__view" role="radiogroup" aria-label="View">
        <label className="segmented__option" data-tooltip="Grid">
          <input type="radio" name="filter-view" value="grid" aria-label="Grid view" checked={view === 'grid'} onChange={() => onView('grid')} />
          <span className="segmented__label">
            <LayoutGrid />
          </span>
        </label>
        <label className="segmented__option" data-tooltip="List">
          <input type="radio" name="filter-view" value="list" aria-label="List view" checked={view === 'list'} onChange={() => onView('list')} />
          <span className="segmented__label">
            <List />
          </span>
        </label>
      </div>
    </div>
  )
}
