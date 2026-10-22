import { ArrowUpRight, Package, PanelsTopLeft, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { date, number } from '../../../../shared/lib/format'
import { Badge, Button } from '../../../../shared/ui/ledger'

type Row = { icon: LucideIcon; label: string; used: number; limit: number | undefined; to: string }

/** "Plan & usage": what the plan allows and how much of it is used. */
export function PlanUsageCard({
  slug,
  planName,
  renewsOn,
  products,
  pages,
  emails,
}: {
  slug: string
  planName: string
  /** The end of the current billing period; null on a plan that doesn't renew. */
  renewsOn: string | null
  products: { used: number; limit: number | undefined }
  pages: { used: number; limit: number | undefined }
  emails: { used: number; limit: number | undefined }
}) {
  const rows: Row[] = [
    { icon: Package, label: 'Products', ...products, to: `/app/${slug}/products` },
    { icon: PanelsTopLeft, label: 'Landing pages', ...pages, to: `/app/${slug}/landing-pages` },
    { icon: Send, label: 'Emails this month', ...emails, to: `/app/${slug}/emails` },
  ]

  return (
    <section className="card span-5 plan-usage" aria-labelledby="plan-usage-title">
      <div className="card__header">
        <div className="card__heading">
          <h2 className="card__title" id="plan-usage-title">
            Plan &amp; usage <Badge tone="solid-accent">{planName}</Badge>
          </h2>
          {renewsOn && <p className="card__subtitle">Renews {date(renewsOn)}</p>}
        </div>
        <Button variant="ghost" icon={ArrowUpRight} to={`/app/${slug}/settings?tab=billing`}>
          Manage
        </Button>
      </div>
      <div className="card__body fill-stack">
        <ul className="usage" role="list">
          {rows.map((row) => {
            const unlimited = row.limit === undefined || row.limit < 0
            const ratio = unlimited ? 0 : row.limit! > 0 ? Math.min(row.used / row.limit!, 1) : row.used > 0 ? 1 : 0
            const tone = ratio >= 1 ? 'danger' : ratio >= 0.85 ? 'warning' : ''
            return (
              <li key={row.label}>
                <Link className={`usage__row${tone ? ` usage__row--${tone}` : ''}`} to={row.to}>
                  <span className="usage__icon">
                    <row.icon />
                  </span>
                  <span className="usage__main">
                    <span className="usage__label">{row.label}</span>
                    <span
                      className="usage__track"
                      role="meter"
                      aria-label={row.label}
                      aria-valuemin={0}
                      aria-valuemax={unlimited ? row.used : row.limit}
                      aria-valuenow={row.used}
                    >
                      <span style={{ '--w': `${(ratio * 100).toFixed(1)}%` } as CSSProperties} />
                    </span>
                  </span>
                  <span className="usage__count">
                    <strong>{number(row.used)}</strong> / {unlimited ? 'Unlimited' : number(row.limit!)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
