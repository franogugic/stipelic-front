import { CircleAlert, Landmark, Trash2, TriangleAlert, Wallet, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { money, number } from '../../../../shared/lib/format'
import { Alert, Button, ConfirmDialog, useToast } from '../../../../shared/ui/ledger'
import { listCampaigns } from '../../../marketing/api/campaigns-api'
import { getHomeSummary, getOrderSummary } from '../../../orders/api/orders-api'
import { getPayoutSummary } from '../../api/payouts-api'
import { useCreatorStore } from '../../model/creator-store'
import type { Creator, PayoutSummary } from '../../model/types'

type Counts = { pages?: number; products?: number; orders?: number; subscribers?: number; campaigns?: number }

const BALANCE_CODE = 'WORKSPACE_HAS_BALANCE'
const BLOCKED_MESSAGE = 'Request a payout of your remaining balance before deleting this workspace.'

/** Settings → Danger zone: what deleting the workspace removes, and the confirmed delete. */
export function DangerTab({ slug, creator }: { slug: string; creator: Creator }) {
  const navigate = useNavigate()
  const toast = useToast()
  const deleteCreatorProfile = useCreatorStore((s) => s.deleteCreatorProfile)
  const resetDeleteFeedback = useCreatorStore((s) => s.resetDeleteCreatorFeedback)

  const [counts, setCounts] = useState<Counts>({})
  const [payout, setPayout] = useState<PayoutSummary | null>(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [blocked, setBlocked] = useState<{ message: string; hasBalance: boolean } | null>(null)

  useEffect(() => {
    let active = true
    const patch = (next: Counts) => active && setCounts((current) => ({ ...current, ...next }))
    getHomeSummary(slug)
      .then((summary) =>
        patch({ pages: summary.landingPageCount, products: summary.productCount, subscribers: summary.subscriberCount }),
      )
      .catch(() => undefined)
    getOrderSummary(slug)
      .then((summary) => patch({ orders: summary.totalOrderCount }))
      .catch(() => undefined)
    listCampaigns(slug)
      .then((campaigns) => patch({ campaigns: campaigns.length }))
      .catch(() => undefined)
    // Money left on the workspace blocks the delete; the server enforces it too, this just says so up front.
    getPayoutSummary(slug)
      .then((summary) => active && setPayout(summary))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [slug])

  const rows: Array<[number | undefined, string]> = [
    [counts.pages, 'landing pages'],
    [counts.products, 'products'],
    [counts.orders, 'orders'],
    [counts.subscribers, 'subscribers'],
    [counts.campaigns, 'email campaigns'],
  ]
  const paid = creator.planCode !== 'free'
  const moneyLeft = payout !== null && (payout.balanceCents > 0 || payout.pendingPayoutCents > 0)

  const close = () => {
    if (deleting) return
    setOpen(false)
    setBlocked(null)
    resetDeleteFeedback()
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setBlocked(null)
    const ok = await deleteCreatorProfile()
    setDeleting(false)
    if (ok) {
      setOpen(false)
      toast({ tone: 'success', title: 'Workspace deleted' })
      navigate('/', { replace: true })
      return
    }
    const { deleteError, deleteErrorCode } = useCreatorStore.getState()
    setBlocked({
      message: deleteError ?? 'We could not delete this workspace. Please try again.',
      hasBalance: deleteErrorCode === BALANCE_CODE,
    })
  }

  return (
    <>
      <section className="card danger-zone" aria-labelledby="delete-title">
        <div className="card__header">
          <div className="card__heading">
            <h2 className="card__title" id="delete-title">
              Delete workspace
            </h2>
            <p className="card__subtitle">Permanently delete {creator.name} and everything in it.</p>
          </div>
        </div>
        <div className="card__body stack">
          {moneyLeft && payout && (
            <Alert
              tone="danger"
              icon={Wallet}
              title="You still have money in Luma"
              live
              action={
                <>
                  <dl className="kv danger-zone__money">
                    <dt>Available balance</dt>
                    <dd>{money(payout.balanceCents, payout.currency)}</dd>
                    <dt>Pending payout</dt>
                    <dd>{money(payout.pendingPayoutCents, payout.currency)}</dd>
                  </dl>
                  <div>
                    <Button variant="primary" icon={Landmark} to={`/app/${slug}/payouts`}>
                      Go to payouts
                    </Button>
                  </div>
                </>
              }
            >
              {BLOCKED_MESSAGE}
            </Alert>
          )}
          <p className="text-secondary">This deletes:</p>
          <ul className="danger-zone__list" role="list">
            {rows.map(([count, label]) => (
              <li key={label}>
                <X />
                <strong>{count === undefined ? '—' : number(count)}</strong> {label}
              </li>
            ))}
          </ul>
          <Alert tone="warning" icon={TriangleAlert}>
            Your pages go offline straight away
            {paid ? ` and your ${creator.planName} plan is cancelled immediately` : ''}. Export your orders and
            subscribers first if you want to keep them.
          </Alert>
          <div>
            <Button variant="danger" icon={Trash2} disabledReason={moneyLeft ? BLOCKED_MESSAGE : undefined} onClick={() => setOpen(true)}>
              Delete workspace…
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={open}
        title={`Delete ${creator.name}?`}
        text={`This permanently deletes the workspace${
          counts.pages !== undefined && counts.products !== undefined && counts.orders !== undefined && counts.subscribers !== undefined
            ? ` with ${number(counts.pages)} pages, ${number(counts.products)} products, ${number(counts.orders)} orders and ${number(counts.subscribers)} subscribers`
            : ''
        }${paid ? `, and cancels your ${creator.planName} plan immediately` : ''}. This can’t be undone.`}
        confirmLabel="Delete workspace"
        tone="danger"
        requireText={creator.name}
        busy={deleting}
        onCancel={close}
        onConfirm={() => void confirmDelete()}
      >
        {blocked && (
          <Alert
            className="modal__alert"
            tone="danger"
            icon={blocked.hasBalance ? Wallet : CircleAlert}
            title={blocked.hasBalance ? 'You still have money in Luma' : undefined}
            live
            action={
              blocked.hasBalance ? (
                <div>
                  <Link className="link" to={`/app/${slug}/payouts`}>
                    Go to payouts
                  </Link>
                </div>
              ) : undefined
            }
          >
            {blocked.message}
          </Alert>
        )}
      </ConfirmDialog>
    </>
  )
}
