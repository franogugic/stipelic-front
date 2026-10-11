import { ArrowRight, PanelsTopLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { money, number, percent, plural } from '../../../../shared/lib/format'
import { Button, Card, EmptyState } from '../../../../shared/ui/ledger'
import { pageCover } from '../../../landing-pages/model/page-cover'
import type { LandingPage } from '../../../landing-pages/model/types'

/** "Top pages": the live pages by revenue (then views), with what each one brings in. */
export function TopPagesCard({ slug, pages, currency }: { slug: string; pages: LandingPage[]; currency: string }) {
  const top = [...pages]
    .filter((page) => page.status !== 'Archived')
    .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents || b.totalViews - a.totalViews)
    .slice(0, 5)

  return (
    <Card
      title="Top pages"
      subtitle="By revenue, all time"
      action={
        <Button variant="ghost" icon={ArrowRight} to={`/app/${slug}/landing-pages`}>
          All pages
        </Button>
      }
    >
      {top.length === 0 ? (
        <EmptyState compact icon={PanelsTopLeft} title="No pages yet" text="Your best pages show up here." />
      ) : (
        <div className="list">
          {top.map((page) => {
            const cover = pageCover(page)
            const lead = page.type === 'LeadGen'
            return (
              <Link className="list__row top-page" to={`/app/${slug}/landing-pages/${page.publicId}`} key={page.publicId}>
                <span className={`${cover.className} cover--thumb`} style={cover.style} aria-hidden="true" />
                <span className="list__grow person">
                  <span className="table__primary">{page.title}</span>
                  <span className="table__secondary">
                    {number(page.totalViews)} views · {lead ? 'Lead capture' : plural(page.purchaseCount, 'sale')}
                  </span>
                </span>
                <span className="person__end">
                  {lead ? (
                    <>
                      <span className="person__value">{plural(page.captureCount, 'email')}</span>
                      <span className="table__secondary">
                        {percent(page.totalViews ? (page.captureCount / page.totalViews) * 100 : 0)} signed up
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="person__value">{money(page.totalRevenueCents, currency, { decimals: false })}</span>
                      <span className="table__secondary">
                        {percent(page.totalViews ? (page.purchaseCount / page.totalViews) * 100 : 0)} bought
                      </span>
                    </>
                  )}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
