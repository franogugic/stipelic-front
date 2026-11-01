import { CircleCheck, Download, Send, Trash2, Upload, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { date, number, plural } from '../../../shared/lib/format'
import { useKeyedLoad } from '../../../shared/lib/use-keyed-load'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  SkeletonBlock,
  SkeletonCards,
  SkeletonRows,
  StatusBadge,
  TableFilterBar,
  TableFooter,
  deliveryIssueKey,
  subscriberStatusKey,
  useToast,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { PageControls } from '../../analytics/components/PageControls'
import { usePagePeriod } from '../../analytics/model/use-page-period'
import { deleteContact, exportContacts, getContactPeriodStats, getContactStats, searchContacts } from '../api/contacts-api'
import { GrowthCard } from '../components/GrowthCard'
import { JoinedCard } from '../components/JoinedCard'
import { SubscribersBoard } from '../components/SubscribersBoard'
import type { Contact, ContactStats } from '../model/types'

const PAGE_SIZE = 12
const SEARCH_MAX_LENGTH = 100
const SEARCH_DEBOUNCE_MS = 350
const STATUS_FILTERS: Array<[string, string]> = [
  ['all', 'All'],
  ['active', 'Active'],
  ['unsubscribed', 'Unsubscribed'],
]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Stats = { key: string; stats: ContactStats | null }
/** The contacts loaded so far for one set of filters (first page, then "Load more" pages). */
type Results = { key: string; contacts: Contact[]; hasMore: boolean; error: boolean }

export function SubscribersPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { period, setPeriod, params: searchParams, update } = usePagePeriod('subscribers')
  const toast = useToast()
  const creator = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator : null))
  const plans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])
  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])
  const planName = creator?.planName ?? 'your plan'
  const contactLimit = creator ? (plans.find((plan) => plan.code === creator.planCode)?.limits.max_contacts ?? null) : null
  // Right after an import the page says so (the link comes with ?imported=<new contacts>).
  const imported = Number(searchParams.get('imported')) || 0
  const periodStats = useKeyedLoad(slug ? `${slug}|${period.id}` : null, () => getContactPeriodStats(slug, period.id))

  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  // The link from a page's analytics ("View all in Subscribers") arrives with ?source={page public id}.
  const [sourceId, setSourceId] = useState(() => {
    const requested = searchParams.get('source') ?? ''
    return UUID.test(requested) ? requested : ''
  })
  const [attempt, setAttempt] = useState(0)
  const [results, setResults] = useState<Results | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState(false)

  // The status filter lives in the URL, so a filtered list can be linked to.
  const statusParam = searchParams.get('status') ?? ''
  const statusKey = statusParam === 'active' || statusParam === 'unsubscribed' ? statusParam : 'all'
  const status = statusKey === 'all' ? undefined : statusKey

  const filtersActive = Boolean(sourceId || term || status)
  const resultsKey = `${slug}|${sourceId}|${term}|${statusKey}|${attempt}`

  const loadStats = useCallback(() => {
    getContactStats(slug)
      .then((data) => setStats({ key: slug, stats: data }))
      .catch(() => setStats({ key: slug, stats: null }))
  }, [slug])

  useEffect(() => {
    if (slug) loadStats()
  }, [slug, loadStats])

  // The search runs 350 ms after the last keystroke, trimmed.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  // A new set of filters starts from the first page again; a result for older filters is never shown.
  useEffect(() => {
    if (!slug) return
    let current = true
    searchContacts(slug, { search: term || undefined, landingPageId: sourceId || undefined, status, limit: PAGE_SIZE })
      .then((page) => current && setResults({ key: resultsKey, contacts: page.contacts, hasMore: page.hasMore, error: false }))
      .catch(() => current && setResults({ key: resultsKey, contacts: [], hasMore: false, error: true }))
    return () => {
      current = false
    }
  }, [slug, sourceId, term, status, resultsKey])

  const statsState = stats?.key === slug ? stats : null
  const first = results?.key === resultsKey ? results : null
  const contacts = first?.contacts ?? []
  const hasMore = first?.hasMore ?? false
  const total = statsState?.stats?.total

  const retry = () => {
    setStats(null)
    loadStats()
    periodStats.reload()
    setResults(null)
    setAttempt((value) => value + 1)
  }

  const loadMore = () => {
    const last = contacts[contacts.length - 1]
    if (!last || loadingMore) return
    setLoadingMore(true)
    const requestKey = resultsKey
    searchContacts(slug, {
      search: term || undefined,
      landingPageId: sourceId || undefined,
      status,
      afterEmail: last.email,
      limit: PAGE_SIZE,
    })
      // Appended only while the filters are still the ones it was asked for.
      .then((page) =>
        setResults((current) =>
          current?.key === requestKey
            ? { ...current, contacts: [...current.contacts, ...page.contacts], hasMore: page.hasMore }
            : current,
        ),
      )
      .catch(() => toast({ tone: 'danger', title: 'We couldn’t load more subscribers. Please try again.' }))
      .finally(() => setLoadingMore(false))
  }

  const runExport = async () => {
    setExporting(true)
    try {
      await exportContacts(slug, { search: term || undefined, landingPageId: sourceId || undefined, status })
    } catch (error) {
      toast({
        tone: 'danger',
        title: error instanceof Error ? error.message : 'We couldn’t export the subscribers. Please try again.',
      })
    } finally {
      setExporting(false)
    }
  }

  const confirmDelete = async () => {
    const target = deleteTarget
    if (!target) return
    setDeleting(true)
    try {
      await deleteContact(slug, target.email)
      setResults((current) =>
        current ? { ...current, contacts: current.contacts.filter((contact) => contact.email !== target.email) } : current,
      )
      loadStats()
      toast({ tone: 'success', title: 'Subscriber deleted' })
    } catch (error) {
      toast({
        tone: 'danger',
        title: error instanceof Error ? error.message : 'We couldn’t delete the subscriber. Please try again.',
      })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const setStatusFilter = (key: string) => update({ status: key === 'all' ? null : key })

  const clearFilters = () => {
    setSearch('')
    setTerm('')
    setSourceId('')
    setStatusFilter('all')
  }

  // With a filter the API has no filtered total, so the count is what is loaded ("+" while there is more).
  const loadedCount = `${number(contacts.length)}${hasMore ? '+' : ''}`
  const showingText = filtersActive || total === undefined ? `Showing ${loadedCount}` : `Showing ${number(contacts.length)} of ${number(total)}`

  const list = () => {
    if (!first) return <SkeletonRows count={6} />
    if (first.error) return <ErrorState compact onRetry={retry} />
    if (contacts.length === 0) {
      return (
        <EmptyState
          compact
          icon={Users}
          title="No subscribers match these filters"
          action={{ label: 'Clear filters', variant: 'ghost', onClick: clearFilters }}
        />
      )
    }
    return (
      <>
        <div className="table-wrap">
          <table className="table table--stack">
            <thead>
              <tr>
                <th scope="col">Subscriber</th>
                <th scope="col">Joined on</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col" className="is-actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.email}>
                  <td className="is-lead">
                    <span className="table__primary">{contact.email}</span>
                  </td>
                  <td data-label="Joined on">
                    <div className="cluster cluster--sm">
                      {contact.importedAt && (
                        <Badge tone="info" icon={Upload}>
                          Import
                        </Badge>
                      )}
                      {contact.sourceList.map((source) => (
                        <Badge tone="outline" key={source.landingPagePublicId}>
                          {source.title}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td data-label="Date" className="num">
                    {date(contact.firstCapturedAt)}
                  </td>
                  <td data-label="Status">
                    <div className="cluster cluster--sm">
                      <StatusBadge kind="subscriber" value={subscriberStatusKey(contact.isUnsubscribed)} />
                      {deliveryIssueKey(contact.deliveryIssue) && <StatusBadge kind="subscriber" value={deliveryIssueKey(contact.deliveryIssue) ?? ''} />}
                    </div>
                  </td>
                  <td className="is-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={Trash2}
                      aria-label={`Delete ${contact.email}`}
                      onClick={() => setDeleteTarget(contact)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableFooter count={showingText} onLoadMore={hasMore ? loadMore : undefined} loading={loadingMore} />
      </>
    )
  }

  const body = () => {
    if (!statsState) {
      return (
        <div className="stack stack--lg">
          <SkeletonCards count={4} />
          <SkeletonRows count={6} />
        </div>
      )
    }
    const data = statsState.stats
    if (!data) return <ErrorState onRetry={retry} />
    if (data.total === 0) {
      return (
        <EmptyState
          icon={Users}
          title="No subscribers yet"
          text="They appear when someone leaves an email on one of your pages."
        />
      )
    }
    const statusCount = (key: string) =>
      key === 'active' ? data.active : key === 'unsubscribed' ? data.unsubscribed : data.total
    const periodData = periodStats.load.status === 'success' ? periodStats.load.data : null
    return (
      <div className="stack stack--lg reveal">
        <PageControls
          period={period.id}
          onPeriod={setPeriod}
          series={
            periodData
              ? { period: periodData.period, timezone: periodData.timezone, since: periodData.range.from, range: periodData.range, previousRange: periodData.previousRange }
              : null
          }
          loading={periodStats.load.status === 'loading'}
          updatedAt={periodStats.load.status === 'success' ? periodStats.load.at : new Date()}
          sinceNote="your first subscriber"
        />
        {periodStats.load.status === 'error' ? (
          <section className="card">
            <ErrorState
              compact
              title="We couldn’t load your numbers"
              text="The figures for this period didn’t load. Your list is safe — try again in a moment."
              onRetry={periodStats.reload}
            />
          </section>
        ) : periodData ? (
          <>
            <SubscribersBoard stats={periodData} plan={{ name: planName, contactLimit: contactLimit !== null && contactLimit >= 0 ? contactLimit : null }} />
            <div className="dash">
              <div className="span-8">
                <GrowthCard stats={periodData} />
              </div>
              <div className="span-4">
                <JoinedCard stats={periodData} onShowAll={() => setPeriod('all')} />
              </div>
            </div>
          </>
        ) : (
          <>
            <SkeletonCards count={4} />
            <div className="dash">
              <div className="span-8">
                <SkeletonBlock />
              </div>
              <div className="span-4">
                <SkeletonBlock />
              </div>
            </div>
          </>
        )}
        <section className="card" aria-labelledby="subscriber-list-title">
          <div className="card__header">
            <div className="card__heading">
              <h2 className="card__title" id="subscriber-list-title">
                Everyone on your list
              </h2>
              <p className="card__subtitle">
                {plural(data.total, 'person', 'people')} · {number(data.active)} active · any date
              </p>
            </div>
          </div>
          <TableFilterBar
            noun="email"
            statuses={STATUS_FILTERS}
            status={statusKey}
            count={statusCount}
            onStatus={setStatusFilter}
            query={search}
            onQuery={setSearch}
            maxLength={SEARCH_MAX_LENGTH}
            extra={
              <Select aria-label="Source" value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
                <option value="">All sources</option>
                {/* A source from the link that isn't among the pages with contacts still has to be selectable. */}
                {sourceId && !data.sources.some((source) => source.landingPagePublicId === sourceId) && (
                  <option value={sourceId}>This page</option>
                )}
                {data.sources.map((source) => (
                  <option key={source.landingPagePublicId} value={source.landingPagePublicId}>
                    {source.title}
                  </option>
                ))}
              </Select>
            }
          />
          {list()}
        </section>
      </div>
    )
  }

  const noContactsAtAll = total === 0

  return (
    <AppShell slug={slug} activeSection="subscribers">
      <PageHeader
        title={<em>Subscribers</em>}
        subtitle="Everyone who left an email on your pages."
        actions={
          <>
            <Button
              variant="secondary"
              icon={Download}
              loading={exporting}
              disabledReason={noContactsAtAll ? 'There are no subscribers to export yet.' : undefined}
              onClick={() => void runExport()}
            >
              Export
            </Button>
            <Button variant="secondary" icon={Upload} to={`/app/${slug}/subscribers/import`}>
              Import
            </Button>
            <Button variant="primary" icon={Send} to={`/app/${slug}/emails`}>
              Send to all
            </Button>
          </>
        }
      />
      {imported > 0 && (
        <Alert tone="success" icon={CircleCheck} title={`${plural(imported, 'contact')} imported`} live>
          They’re in your list with “Import” as their source, counted in “New” and marked on the growth chart.
        </Alert>
      )}
      {body()}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.email ?? ''}?`}
        text="Removes this contact from all your landing pages. If they unsubscribed, they stay suppressed."
        confirmLabel="Delete"
        tone="danger"
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AppShell>
  )
}
