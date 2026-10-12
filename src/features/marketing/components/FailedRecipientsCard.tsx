import { MailCheck } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, SkeletonRows } from '../../../shared/ui/ledger'
import { classifyFailure } from '../model/failure-kind'
import type { FailedRecipient } from '../model/types'

/** "Failed recipients": each address with the provider's reason and what kind of failure it is. */
export function FailedRecipientsCard({
  recipients,
  status,
  empty,
  onRetry,
}: {
  recipients: FailedRecipient[]
  status: 'idle' | 'loading' | 'success' | 'error'
  /** Shown when there is nothing to list. */
  empty: { title: string; text: string }
  onRetry: () => void
}) {
  const body = () => {
    if (status === 'loading') return <SkeletonRows count={3} />
    if (status === 'error') return <ErrorState compact onRetry={onRetry} />
    if (recipients.length === 0) return <EmptyState compact icon={MailCheck} title={empty.title} text={empty.text} />
    return (
      <>
        <div className="table-wrap">
          <table className="table table--stack">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Reason</th>
                <th scope="col">Type</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => {
                const kind = classifyFailure(recipient.lastError)
                return (
                  <tr key={recipient.email}>
                    <td className="is-lead">
                      <span className="table__primary mono">{recipient.email}</span>
                    </td>
                    <td data-label="Reason" className="text-secondary">
                      {recipient.lastError || '—'}
                    </td>
                    <td data-label="Type">
                      <Badge tone={kind.tone}>{kind.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span className="table-footer__count">
            Hard bounces usually mean the address no longer exists — resending them rarely works.
          </span>
        </div>
      </>
    )
  }
  return (
    <Card title="Failed recipients" subtitle={recipients.length > 0 && status === 'success' ? `${recipients.length} addresses` : undefined} flush>
      {body()}
    </Card>
  )
}
