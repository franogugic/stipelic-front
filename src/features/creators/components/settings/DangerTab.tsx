import { Check, CircleAlert, Trash2, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { number } from '../../../../shared/lib/format'
import { Alert, Button, ConfirmDialog, useToast } from '../../../../shared/ui/ledger'
import { listCampaigns } from '../../../marketing/api/campaigns-api'
import { getHomeSummary } from '../../../orders/api/orders-api'
import { useCreatorStore } from '../../model/creator-store'
import type { Creator } from '../../model/types'

type Counts = { pages?: number; products?: number; subscribers?: number; campaigns?: number }

/** Settings → Danger zone: what deleting the workspace removes, and the confirmed delete. */
export function DangerTab({ slug, creator }: { slug: string; creator: Creator }) {
  const navigate = useNavigate()
  const toast = useToast()
  const deleteCreatorProfile = useCreatorStore((s) => s.deleteCreatorProfile)
  const resetDeleteFeedback = useCreatorStore((s) => s.resetDeleteCreatorFeedback)

  const [counts, setCounts] = useState<Counts>({})
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const patch = (next: Counts) => active && setCounts((current) => ({ ...current, ...next }))
    getHomeSummary(slug)
      .then((summary) =>
        patch({ pages: summary.landingPageCount, products: summary.productCount, subscribers: summary.subscriberCount }),
      )
      .catch(() => undefined)
    listCampaigns(slug)
      .then((campaigns) => patch({ campaigns: campaigns.length }))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [slug])

  // What goes: the counted things first, then the ones that have no count. Sales are not here; they stay (below).
  const rows: Array<[number | undefined, string, string]> = [
    [counts.pages, 'landing page', 'landing pages'],
    [counts.products, 'product', 'products'],
    [counts.subscribers, 'contact', 'contacts'],
    [counts.campaigns, 'email campaign', 'email campaigns'],
  ]
  const alsoGone = ['product files', 'email templates', 'analytics', 'buyers’ download links']
  const paid = creator.planCode !== 'free'

  const close = () => {
    if (deleting) return
    setOpen(false)
    setDeleteError(null)
    resetDeleteFeedback()
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    const ok = await deleteCreatorProfile()
    setDeleting(false)
    if (ok) {
      setOpen(false)
      toast({ tone: 'success', title: 'Workspace deleted' })
      navigate('/', { replace: true })
      return
    }
    setDeleteError(useCreatorStore.getState().deleteError ?? 'We could not delete this workspace. Please try again.')
  }

  return (
    <>
      <section className="card danger-zone" aria-labelledby="delete-title">
        <div className="card__header">
          <div className="card__heading">
            <h2 className="card__title" id="delete-title">
              Delete workspace
            </h2>
            <p className="card__subtitle">Delete {creator.name} and the data in it.</p>
          </div>
        </div>
        <div className="card__body stack">
          <p className="text-secondary">This is deleted for good:</p>
          <ul className="danger-zone__list" role="list">
            {rows.map(([count, one, many]) => (
              <li key={many}>
                <X />
                <strong>{count === undefined ? '—' : number(count)}</strong> {count === 1 ? one : many}
              </li>
            ))}
            {alsoGone.map((label) => (
              <li key={label}>
                <X />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-secondary">This stays:</p>
          <ul className="danger-zone__list danger-zone__list--keep" role="list">
            <li>
              <Check />
              Paid and refunded sales, in the books with the buyer’s email and country
            </li>
            <li>
              <Check />
              Your user account: you can still log in and start a new workspace
            </li>
            <li>
              <Check />
              Your connected Stripe account, if you have one, until it is closed after 180 days
            </li>
          </ul>
          <Alert tone="warning" icon={TriangleAlert}>
            Your pages go offline straight away
            {paid ? ` and your ${creator.planName} plan is cancelled immediately` : ''}. Export your orders and
            subscribers first if you want a copy.
          </Alert>
          <div>
            <Button variant="danger" icon={Trash2} onClick={() => setOpen(true)}>
              Delete workspace…
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={open}
        title={`Delete ${creator.name}?`}
        text={
          <>
            This deletes {creator.name}’s pages, products, files, contacts, campaigns, templates, analytics and buyers’
            download links for good{paid ? `, and cancels your ${creator.planName} plan immediately` : ''}.
            <br />
            <br />
            Paid and refunded sales stay in the books with the buyer’s email and country. Your user account stays. Your
            connected Stripe account is closed after 180 days.
          </>
        }
        confirmLabel="Delete workspace"
        tone="danger"
        requireText={creator.name}
        busy={deleting}
        onCancel={close}
        onConfirm={() => void confirmDelete()}
      >
        {deleteError && (
          <Alert className="modal__alert" tone="danger" icon={CircleAlert} live>
            {deleteError}
          </Alert>
        )}
      </ConfirmDialog>
    </>
  )
}
