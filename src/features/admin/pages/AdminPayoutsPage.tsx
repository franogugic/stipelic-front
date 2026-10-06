import { Banknote, CircleCheck, Hourglass, Plus, Receipt, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { date, initials, money, number } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Metric,
  Money,
  PageHeader,
  Segmented,
  SkeletonCards,
  SkeletonRows,
  StatusBadge,
  payoutStatusKey,
  useToast,
} from '../../../shared/ui/ledger'
import { countryName } from '../../creators/components/payouts/payout-format'
import { useCreatorStore } from '../../creators/model/creator-store'
import { getPayoutBalances, getPayoutQueue } from '../api/admin-payouts-api'
import { CreatePayoutModal } from '../components/CreatePayoutModal'
import { MarkFailedModal } from '../components/MarkFailedModal'
import { MarkPaidModal } from '../components/MarkPaidModal'
import { groupIban, totalsByCurrency } from '../model/format'
import type { AdminPayoutQueueItem, CreatorBalanceSummary } from '../model/types'

const QUEUE_LIMIT = 200
const BALANCES_LIMIT = 500
const HISTORY_LIMIT = 50

type HistoryFilter = 'All' | 'Paid' | 'Failed'
type Load<T> = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: T }

const HISTORY_OPTIONS: Array<{ value: HistoryFilter; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Failed', label: 'Failed' },
]

export function AdminPayoutsPage() {
  const toast = useToast()
  // An admin may have no workspace of their own; the shell then shows only the Admin group.
  const slug = useCreatorStore((s) => s.currentCreator?.slug ?? '')

  const [version, setVersion] = useState(0)
  const [queue, setQueue] = useState<{ key: number; load: Load<AdminPayoutQueueItem[]> } | null>(null)
  const [balances, setBalances] = useState<{ key: number; load: Load<CreatorBalanceSummary[]> } | null>(null)
  const [history, setHistory] = useState<{ key: string; load: Load<AdminPayoutQueueItem[]> } | null>(null)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('All')

  const [paidTarget, setPaidTarget] = useState<AdminPayoutQueueItem | null>(null)
  const [paidKey, setPaidKey] = useState(0)
  const [failedTarget, setFailedTarget] = useState<AdminPayoutQueueItem | null>(null)
  const [failedKey, setFailedKey] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [createKey, setCreateKey] = useState(0)

  const historyKey = `${version}|${historyFilter}`

  useEffect(() => {
    let active = true
    getPayoutQueue('Pending', QUEUE_LIMIT)
      .then((data) => active && setQueue({ key: version, load: { status: 'success', data } }))
      .catch(() => active && setQueue({ key: version, load: { status: 'error' } }))
    getPayoutBalances(1, BALANCES_LIMIT)
      .then((data) => active && setBalances({ key: version, load: { status: 'success', data } }))
      .catch(() => active && setBalances({ key: version, load: { status: 'error' } }))
    return () => {
      active = false
    }
  }, [version])

  // "All" has no status filter, so it drops the Pending rows itself (they are in the queue above).
  useEffect(() => {
    let active = true
    getPayoutQueue(historyFilter === 'All' ? undefined : historyFilter, HISTORY_LIMIT)
      .then((data) => {
        if (!active) return
        const rows = historyFilter === 'All' ? data.filter((row) => row.status !== 'Pending') : data
        setHistory({ key: historyKey, load: { status: 'success', data: rows } })
      })
      .catch(() => active && setHistory({ key: historyKey, load: { status: 'error' } }))
    return () => {
      active = false
    }
  }, [historyKey, historyFilter])

  const reload = () => setVersion((value) => value + 1)
  const queueLoad: Load<AdminPayoutQueueItem[]> = queue?.key === version ? queue.load : { status: 'loading' }
  const balancesLoad: Load<CreatorBalanceSummary[]> = balances?.key === version ? balances.load : { status: 'loading' }
  const historyLoad: Load<AdminPayoutQueueItem[]> = history?.key === historyKey ? history.load : { status: 'loading' }

  const openPaid = (request: AdminPayoutQueueItem) => {
    setPaidKey((key) => key + 1)
    setPaidTarget(request)
  }
  const openFailed = (request: AdminPayoutQueueItem) => {
    setFailedKey((key) => key + 1)
    setFailedTarget(request)
  }
  const openCreate = () => {
    setCreateKey((key) => key + 1)
    setCreateOpen(true)
  }

  const metrics = () => {
    if (queueLoad.status !== 'success' || balancesLoad.status !== 'success') {
      return queueLoad.status === 'error' || balancesLoad.status === 'error' ? null : <SkeletonCards count={3} />
    }
    const requested = totalsByCurrency(queueLoad.data, (row) => row.currency, (row) => row.amountCents)
    const owed = totalsByCurrency(balancesLoad.data, (row) => row.currency, (row) => row.balanceCents)
    const meta = (others: string[]) => (others.length > 0 ? others.join(' · ') : undefined)
    return (
      <div className="grid grid--3">
        <Metric label="Waiting" icon={Hourglass} value={number(queueLoad.data.length)} meta="requests" />
        <Metric
          label="Requested total"
          icon={Banknote}
          value={<Money amountCents={requested.primary.cents} currency={requested.primary.currency} />}
          meta={meta(requested.others)}
        />
        <Metric
          label="Creator balances"
          icon={Wallet}
          value={<Money amountCents={owed.primary.cents} currency={owed.primary.currency} />}
          meta={meta(owed.others)}
        />
      </div>
    )
  }

  const queueCard = () => {
    if (queueLoad.status === 'loading') return <SkeletonRows count={4} />
    if (queueLoad.status === 'error') return <ErrorState compact onRetry={reload} />
    if (queueLoad.data.length === 0) {
      return (
        <EmptyState
          compact
          icon={CircleCheck}
          title="All caught up"
          text="No payout requests are waiting. New ones show up here and in your inbox."
        />
      )
    }
    return (
      <div className="table-wrap">
        <table className="table table--stack">
          <thead>
            <tr>
              <th scope="col">Creator</th>
              <th scope="col">Requested</th>
              <th scope="col">IBAN</th>
              <th scope="col">Country</th>
              <th scope="col" className="is-num">
                Amount
              </th>
              <th scope="col" className="is-actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {queueLoad.data.map((row) => (
              <tr key={row.publicId}>
                <td className="is-lead">
                  <span className="table__primary">{row.accountHolderName}</span>
                  <span className="table__secondary">
                    {row.creatorName} · {row.creatorSlug}
                  </span>
                </td>
                <td data-label="Requested" className="num">
                  {date(row.createdAt)}
                </td>
                <td data-label="IBAN" className="mono text-sm">
                  {groupIban(row.iban)}
                </td>
                <td data-label="Country">{countryName(row.bankCountryCode)}</td>
                <td data-label="Amount" className="is-num">
                  <Money amountCents={row.amountCents} currency={row.currency} />
                </td>
                <td className="is-actions">
                  <div className="cluster cluster--sm cluster--nowrap">
                    <Button variant="primary" size="sm" onClick={() => openPaid(row)}>
                      Mark as paid
                    </Button>
                    <Button variant="danger-ghost" size="sm" onClick={() => openFailed(row)}>
                      Failed
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const balancesCard = () => {
    if (balancesLoad.status === 'loading') return <SkeletonRows count={4} />
    if (balancesLoad.status === 'error') return <ErrorState compact onRetry={reload} />
    if (balancesLoad.data.length === 0) {
      return <EmptyState compact icon={Wallet} title="No balances" text="Creators with money owed to them show up here." />
    }
    return (
      <div className="list">
        {balancesLoad.data.map((balance) => (
          <div className="list__row" key={balance.creatorPublicId}>
            <Avatar size="sm" neutral>
              {initials(balance.name)}
            </Avatar>
            <span className="list__grow">
              <strong>{balance.name}</strong>
              <span className="table__secondary">{balance.slug}</span>
            </span>
            {balance.workspaceStatus === 'Disabled' && <Badge tone="neutral">Deleted</Badge>}
            {!balance.hasPayoutProfile && <Badge tone="warning">No IBAN</Badge>}
            <span className="num">{money(balance.balanceCents, balance.currency)}</span>
          </div>
        ))}
      </div>
    )
  }

  const historyCard = () => {
    if (historyLoad.status === 'loading') return <SkeletonRows count={4} />
    if (historyLoad.status === 'error') return <ErrorState compact onRetry={reload} />
    if (historyLoad.data.length === 0) {
      return <EmptyState compact icon={Receipt} title="No payouts yet" text="Paid and failed payouts show up here." />
    }
    return (
      <div className="list">
        {historyLoad.data.map((row) => (
          <div className="list__row" key={row.publicId}>
            <span className="list__grow">
              <strong>{row.creatorName}</strong>
              <span className="table__secondary">
                {date(row.createdAt)} · {row.bankReference || row.note || '—'}
              </span>
            </span>
            <StatusBadge kind="payout" value={payoutStatusKey(row.status)} />
            <span className="num">{money(row.amountCents, row.currency)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <AppShell slug={slug} activeSection="admin-payouts">
      <PageHeader
        eyebrow="Platform admin"
        title={
          <>
            Payout <em>requests</em>
          </>
        }
        subtitle="Bank-transfer creators waiting for their money."
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreate}>
            Create payout manually
          </Button>
        }
      />
      <div className="stack stack--lg reveal">
        {metrics()}
        <Card title="Queue" flush>
          {queueCard()}
        </Card>
        <div className="grid grid--2">
          <Card title="Creator balances">{balancesCard()}</Card>
          <Card
            title="History"
            action={
              <Segmented
                label="History filter"
                options={HISTORY_OPTIONS}
                value={historyFilter}
                onChange={(value) => setHistoryFilter(value as HistoryFilter)}
              />
            }
          >
            {historyCard()}
          </Card>
        </div>
      </div>

      <MarkPaidModal
        key={`paid-${paidKey}`}
        request={paidTarget}
        onClose={() => setPaidTarget(null)}
        onDone={(message) => {
          setPaidTarget(null)
          toast({ tone: 'success', title: 'Payout marked as paid', message })
          reload()
        }}
      />
      <MarkFailedModal
        key={`failed-${failedKey}`}
        request={failedTarget}
        onClose={() => setFailedTarget(null)}
        onDone={() => {
          setFailedTarget(null)
          toast({ tone: 'success', title: 'Payout marked as failed', message: 'The amount is back in the creator’s balance.' })
          reload()
        }}
      />
      {createKey > 0 && balancesLoad.status === 'success' && (
        <CreatePayoutModal
          key={createKey}
          open={createOpen}
          balances={balancesLoad.data}
          onClose={() => setCreateOpen(false)}
          onDone={() => {
            setCreateOpen(false)
            toast({ tone: 'success', title: 'Pending payout created', message: 'Mark it as paid once the transfer is sent.' })
            reload()
          }}
        />
      )}
    </AppShell>
  )
}
