import { Gift, Layers, Package } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { date, dateShort, time } from '../../../shared/lib/format'
import { Menu } from '../../../shared/ui/ledger'
import type { MenuItem } from '../../../shared/ui/ledger'
import type { Product } from '../../products/model/types'
import { PERIODS, inZone, scopeProducts } from '../model/series'
import type { AnalyticsPeriod, PeriodWindow } from '../model/types'
import { PeriodMenu } from './PeriodMenu'

/** "23 – 29 Sep 2026" or "31 Aug – 29 Sep 2026"; without the year for the comparison. */
function dateRange(from: Date, to: Date, withYear = true) {
  const end = withYear ? date(to) : dateShort(to)
  return from.getMonth() === to.getMonth() ? `${from.getDate()} – ${end}` : `${dateShort(from)} – ${end}`
}

function Caption({ series, sinceNote }: { series: PeriodWindow; sinceNote: string }) {
  const period = PERIODS.find((candidate) => candidate.id === series.period)
  const zone = (instant: string) => inZone(instant, series.timezone)
  const to = zone(series.range.to)
  if (series.period === 'today') {
    return (
      <>
        {date(to)}, until {time(to)} <span>· compared with {period?.compare}</span>
      </>
    )
  }
  if (series.period === 'all') {
    return (
      <>
        Since {date(zone(series.since))} <span>· {sinceNote}</span>
      </>
    )
  }
  const from = zone(series.range.from)
  // The range's end is exclusive-ish ("now" or midnight); the last day shown is the one before midnight.
  const last = to.getHours() === 0 && to.getMinutes() === 0 ? new Date(to.getFullYear(), to.getMonth(), to.getDate() - 1) : to
  const previous = series.previousRange
  const previousFrom = previous ? zone(previous.from) : null
  const previousToRaw = previous ? zone(previous.to) : null
  const previousTo =
    previousToRaw && previousToRaw.getHours() === 0 && previousToRaw.getMinutes() === 0
      ? new Date(previousToRaw.getFullYear(), previousToRaw.getMonth(), previousToRaw.getDate() - 1)
      : previousToRaw
  return (
    <>
      {dateRange(from, last)}
      {previousFrom && previousTo && <span> · compared with {dateRange(previousFrom, previousTo, false)}</span>}
    </>
  )
}

function productItems(products: Product[], selectedId: string | null, onSelect: (id: string | null) => void): MenuItem[] {
  // Active products first, then archived ones.
  const byStatus = (list: Product[]) => [...list].sort((a, b) => Number(a.status === 'Archived') - Number(b.status === 'Archived'))
  const item = (product: Product): MenuItem => ({
    label: `${product.name}${product.status === 'Active' ? '' : ' · archived'}`,
    icon: product.priceCents > 0 ? Package : Gift,
    checked: product.publicId === selectedId,
    onSelect: () => onSelect(product.publicId),
  })
  const sold = byStatus(products.filter((product) => product.priceCents > 0))
  const free = byStatus(products.filter((product) => product.priceCents === 0))
  return [
    { label: 'All products', icon: Layers, checked: selectedId === null, onSelect: () => onSelect(null) },
    ...(sold.length > 0 ? [{ group: 'Sold', items: sold.map(item) }] : []),
    ...(free.length > 0 ? [{ group: 'Given away for an email', items: free.map(item) }] : []),
  ]
}

/**
 * The one control of an analytics page: the period (and on the dashboard the product), the dates they cover and a live
 * marker. Every block of the page follows it. It sticks to the top while the page scrolls.
 */
export function PageControls({
  period,
  onPeriod,
  series,
  loading,
  updatedAt,
  sinceNote,
  scope,
}: {
  period: AnalyticsPeriod
  onPeriod: (period: AnalyticsPeriod) => void
  /** The window the numbers cover (an analytics series, or a summary's period and range); null while it loads. */
  series: PeriodWindow | null
  loading: boolean
  updatedAt: Date
  sinceNote: string
  /** The dashboard's product picker: every product it can be narrowed to, and the chosen one (null: all). */
  scope?: { products: Product[]; selectedId: string | null; onSelect: (id: string | null) => void }
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  // The bar gets a backdrop once it sticks to the top edge.
  useEffect(() => {
    const update = () => {
      const bar = barRef.current
      if (!bar) return
      const top = parseFloat(window.getComputedStyle(bar).top) || 0
      setStuck(bar.getBoundingClientRect().top <= top + 0.5 && window.scrollY > 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const selected = scope?.products.find((product) => product.publicId === scope.selectedId) ?? null

  return (
    <div
      className={`page-controls${stuck ? ' is-stuck' : ''}`}
      role="group"
      aria-label={scope ? 'Period and product for this page' : 'Period for this page'}
      ref={barRef}
    >
      <div className="page-controls__pickers">
        <PeriodMenu period={period} onPeriod={onPeriod} triggerClassName="page-controls__period" />
        {scope && (
          <Menu
            label="Product"
            triggerIcon={selected ? (selected.priceCents > 0 ? Package : Gift) : Layers}
            triggerLabel={selected ? selected.name : 'All products'}
            triggerClassName={`page-controls__product${selected ? ' is-scoped' : ''}`}
            caret
            align="start"
            items={productItems(scopeProducts(scope.products), scope.selectedId, scope.onSelect)}
          />
        )}
      </div>
      <p className="page-controls__range" aria-live="polite">
        {loading ? 'Loading…' : series ? <Caption series={series} sinceNote={sinceNote} /> : null}
      </p>
      <span className="live">
        <span className="live__dot" aria-hidden="true" />
        Live · updated {time(updatedAt)}
      </span>
    </div>
  )
}
