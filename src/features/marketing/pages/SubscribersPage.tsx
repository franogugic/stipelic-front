import { Download, Send, Trash2, UserCheck, UserPlus, Users, UserX } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { date, month, monthYear, number, plural } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Badge,
  Bars,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  HBars,
  Metric,
  PageHeader,
  SearchInput,
  Select,
  SkeletonCards,
  SkeletonRows,
  StatusBadge,
  TableFooter,
  subscriberStatusKey,
  useToast,
} from '../../../shared/ui/ledger'
import { deleteContact, exportContacts, getContactStats, searchContacts } from '../api/contacts-api'
import type { Contact, ContactStats } from '../model/types'

const PAGE_SIZE = 12
const SEARCH_MAX_LENGTH = 100
const SEARCH_DEBOUNCE_MS = 350
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Stats = { key: string; stats: ContactStats | null }
/** The contacts loaded so far for one set of filters (first page, then "Load more" pages). */
type Results = { key: string; contacts: Contact[]; hasMore: boolean; error: boolean }

export function SubscribersPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const toast = useToast()

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

  const filtersActive = Boolean(sourceId || term)
  const resultsKey = `${slug}|${sourceId}|${term}|${attempt}`

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
    searchContacts(slug, { search: term || undefined, landingPageId: sourceId || undefined, limit: PAGE_SIZE })
      .then((page) => current && setResults({ key: resultsKey, contacts: page.contacts, hasMore: page.hasMore, error: false }))
      .catch(() => current && setResults({ key: resultsKey, contacts: [], hasMore: false, error: true }))
    return () => {
      current = false
    }
  }, [slug, sourceId, term, resultsKey])

  const statsState = stats?.key === slug ? stats : null
  const first = results?.key === resultsKey ? results : null
  const contacts = first?.contacts ?? []
  const hasMore = first?.hasMore ?? false
  const total = statsState?.stats?.total

  const retry = () => {
    setStats(null)
    loadStats()
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
      await exportContacts(slug, { search: term || undefined, landingPageId: sourceId || undefined })
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

  const clearFilters = () => {
    setSearch('')
    setTerm('')
    setSourceId('')
  }

  // With a filter the API has no filtered total, so the count is what is loaded ("+" while there is more).
  const loadedCount = `${number(contacts.length)}${hasMore ? '+' : ''}`
  const showingText = filtersActive || total === undefined ? `Showing ${loadedCount}` : `Showing ${number(contacts.length)} of ${number(total)}`
  const resultsCount = filtersActive || total === undefined ? contacts.length : total
  const resultsText = hasMore && filtersActive ? `${loadedCount} results` : plural(resultsCount, 'result')

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
                <th scope="col">Email</th>
                <th scope="col">Sources</th>
                <th scope="col">Joined</th>
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
                  <td data-label="Sources">
                    <div className="cluster cluster--sm">
                      {contact.sourceList.map((source) => (
                        <Badge tone="outline" key={source.landingPagePublicId}>
                          {source.title}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td data-label="Joined" className="num">
                    {date(contact.firstCapturedAt)}
                  </td>
                  <td data-label="Status">
                    <StatusBadge kind="subscriber" value={subscriberStatusKey(contact.isUnsubscribed)} />
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
    return (
      <div className="dash reveal">
        <div className="span-12 grid grid--4">
          <Metric label="Total" icon={Users} value={number(data.total)} />
          <Metric label="Active" icon={UserCheck} value={number(data.active)} />
          <Metric label="New this month" icon={UserPlus} value={number(data.newThisMonth)} />
          <Metric label="Unsubscribed" icon={UserX} value={number(data.unsubscribed)} />
        </div>
        <div className="span-8">
          <Card title="Growth" subtitle="Total subscribers by month">
            <Bars
              values={data.growth.map((point) => point.total)}
              labels={data.growth.map((point) => month(`${point.month}-15`))}
              tooltipLabels={data.growth.map((point) => monthYear(`${point.month}-15`))}
              formatValue={number}
              label="Total subscribers by month"
            />
          </Card>
        </div>
        <div className="span-4">
          <Card title="Sources">
            {data.sources.length > 0 ? (
              <HBars rows={data.sources.map((source) => ({ label: source.title, value: source.count, display: number(source.count) }))} />
            ) : (
              <p className="text-sm text-muted">No sources yet.</p>
            )}
          </Card>
        </div>
        <div className="span-12">
          <Card>
            <div className="toolbar">
              <SearchInput
                placeholder="Search by email"
                aria-label="Search by email"
                maxLength={SEARCH_MAX_LENGTH}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
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
              {first && !first.error && <span className="text-sm text-muted">{resultsText}</span>}
            </div>
            {list()}
          </Card>
        </div>
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
            <Button variant="primary" icon={Send} to={`/app/${slug}/emails`}>
              Send to all
            </Button>
          </>
        }
      />
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
