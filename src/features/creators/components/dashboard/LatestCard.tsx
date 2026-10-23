import { ArrowRight, MailPlus, Receipt } from 'lucide-react'
import { date } from '../../../../shared/lib/format'
import type { Load } from '../../../../shared/lib/use-keyed-load'
import { Button, Card, EmptyState, ErrorState, SkeletonRows, StatusBadge, subscriberStatusKey } from '../../../../shared/ui/ledger'
import { PersonRow } from '../../../analytics/components/PersonRow'
import { OrdersTable } from '../../../orders/components/OrdersTable'
import type { OrdersPage } from '../../../orders/model/types'
import type { ProductSignups } from '../../../products/model/types'

/** Latest activity is never period-based: it is the newest of any date, narrowed to the product when one is chosen. */
export function LatestTransactionsCard({
  slug,
  productId,
  load,
  onRetry,
}: {
  slug: string
  productId: string | null
  load: Load<OrdersPage>
  onRetry: () => void
}) {
  return (
    <Card
      title="Latest transactions"
      subtitle="Newest first, any date"
      flush
      action={
        <Button variant="ghost" icon={ArrowRight} to={`/app/${slug}/orders${productId ? `?product=${productId}` : ''}`}>
          View all
        </Button>
      }
    >
      {load.status === 'loading' ? (
        <SkeletonRows count={5} />
      ) : load.status === 'error' ? (
        <ErrorState compact onRetry={onRetry} />
      ) : load.data.orders.length > 0 ? (
        <OrdersTable orders={load.data.orders.slice(0, 5)} compact />
      ) : (
        <div className="card__body">
          <EmptyState compact icon={Receipt} title="No orders yet" text="Every order appears here as soon as it’s placed." />
        </div>
      )}
    </Card>
  )
}

/** A free product's newest sign-ups, one row per email. */
export function LatestSignupsCard({
  slug,
  load,
  onRetry,
}: {
  slug: string
  load: Load<ProductSignups>
  onRetry: () => void
}) {
  const signups = load.status === 'success' ? load.data.signups : []
  return (
    <Card
      title="Latest sign-ups"
      subtitle="Newest first, any date"
      action={
        signups.length > 0 ? (
          <Button variant="ghost" icon={ArrowRight} to={`/app/${slug}/subscribers`}>
            View all
          </Button>
        ) : undefined
      }
    >
      {load.status === 'loading' ? (
        <SkeletonRows count={5} />
      ) : load.status === 'error' ? (
        <ErrorState compact onRetry={onRetry} />
      ) : signups.length > 0 ? (
        <div className="list">
          {signups.slice(0, 5).map((signup) => (
            <PersonRow key={`${signup.email}-${signup.capturedAt}`} name={signup.email}>
              <span className="cluster cluster--sm">
                {signup.unsubscribed && <StatusBadge kind="subscriber" value={subscriberStatusKey(true)} />}
                <span className="table__secondary">{date(signup.capturedAt)}</span>
              </span>
            </PersonRow>
          ))}
        </div>
      ) : (
        <EmptyState compact icon={MailPlus} title="No sign-ups yet" text="Everyone who gets it for their email appears here." />
      )}
    </Card>
  )
}
