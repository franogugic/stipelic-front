import { Archive, ArrowRight, PanelsTopLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { money, percent, plural } from '../../../../shared/lib/format'
import type { Load } from '../../../../shared/lib/use-keyed-load'
import { Button, Card, EmptyState, ErrorState, SkeletonRows } from '../../../../shared/ui/ledger'
import { QuietPeriod } from '../../../analytics/components/QuietPeriod'
import { periodPhrase } from '../../../analytics/model/series'
import type { AnalyticsPages, AnalyticsPeriod } from '../../../analytics/model/types'
import { pageCover } from '../../../landing-pages/model/page-cover'

/**
 * The best pages of the period (all of them, or the ones that sell or give away the chosen product), ranked by revenue,
 * then sign-ups, then views.
 */
export function TopPagesCard({
  slug,
  period,
  load,
  scope,
  hasArchivedPages,
  onRetry,
  onShowAll,
}: {
  slug: string
  period: AnalyticsPeriod
  load: Load<AnalyticsPages>
  /** The chosen product, or null for the whole workspace. */
  scope: { free: boolean } | null
  /** The chosen product has pages, but all of them are archived. */
  hasArchivedPages: boolean
  onRetry: () => void
  onShowAll: () => void
}) {
  const free = scope?.free ?? false
  const title = scope ? (free ? 'Pages that give it away' : 'Pages that sell it') : 'Top pages'

  const body = () => {
    if (load.status === 'loading') return <SkeletonRows count={4} />
    if (load.status === 'error') return <ErrorState compact onRetry={onRetry} />
    const { pages, pageCount, currency } = load.data
    if (pages.length === 0) {
      if (pageCount > 0) {
        return (
          <QuietPeriod
            period={period}
            icon={PanelsTopLeft}
            title="No activity in this period"
            text="None of the pages had a view, a sign-up or a sale."
            onShowAll={onShowAll}
          />
        )
      }
      if (scope && hasArchivedPages) {
        return <EmptyState compact icon={Archive} title="No live pages" text="The pages that used it are archived. Their past numbers stay in “All time”." />
      }
      return scope ? (
        <EmptyState compact icon={PanelsTopLeft} title="Not on a page yet" text="Add it to a landing page to start selling or giving it away." />
      ) : (
        <EmptyState compact icon={PanelsTopLeft} title="No pages yet" text="Your best pages show up here." />
      )
    }
    return (
      <div className="list">
        {pages.map((page) => {
          const cover = pageCover(page)
          const lead = page.type === 'LeadGen'
          return (
            <Link className="list__row top-page" to={`/app/${slug}/landing-pages/${page.publicId}`} key={page.publicId}>
              <span className={`${cover.className} cover--thumb`} style={cover.style} aria-hidden="true" />
              <span className="list__grow person">
                <span className="table__primary">{page.title}</span>
                <span className="table__secondary">
                  {plural(page.views, 'view')} · {lead ? 'Lead capture' : plural(page.sales, 'sale')}
                </span>
              </span>
              <span className="person__end">
                {lead ? (
                  <>
                    <span className="person__value">{plural(page.emails, 'email')}</span>
                    <span className="table__secondary">{percent(page.views ? (page.emails / page.views) * 100 : 0)} signed up</span>
                  </>
                ) : (
                  <>
                    <span className="person__value">{money(page.revenueCents, currency, { decimals: false })}</span>
                    <span className="table__secondary">{percent(page.views ? (page.sales / page.views) * 100 : 0)} bought</span>
                  </>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <Card
      title={title}
      subtitle={`${free ? 'By sign-ups' : 'By revenue'} · ${periodPhrase(period)}`}
      action={
        <Button variant="ghost" icon={ArrowRight} to={`/app/${slug}/landing-pages`}>
          All pages
        </Button>
      }
    >
      {body()}
    </Card>
  )
}
