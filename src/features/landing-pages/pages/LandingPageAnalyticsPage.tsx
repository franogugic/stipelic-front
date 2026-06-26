import { ArrowLeft, ChevronDown, Eye, Globe, Loader2, Mail, Pencil, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listEmailCaptures } from '../api/landing-pages-api'
import { AppShell } from '../../../shared/ui/AppShell'
import { useLandingPageStore } from '../model/landing-page-store'
import type { EmailCaptureItem, LandingPageAnalytics, PeriodStats } from '../model/types'

export function LandingPageAnalyticsPage() {
  const navigate = useNavigate()
  const { slug, pageId } = useParams<{ slug: string; pageId: string }>()

  const currentPage = useLandingPageStore((s) => s.currentPage)
  const pageStatus = useLandingPageStore((s) => s.pageStatus)
  const pageError = useLandingPageStore((s) => s.pageError)
  const loadPage = useLandingPageStore((s) => s.loadPage)
  const analytics = useLandingPageStore((s) => s.analytics)
  const loadAnalytics = useLandingPageStore((s) => s.loadAnalytics)

  useEffect(() => {
    if (!slug || !pageId) return
    if (pageStatus === 'idle' || (pageStatus === 'success' && currentPage?.publicId !== pageId)) {
      void loadPage(slug, pageId)
    }
  }, [slug, pageId, pageStatus, currentPage, loadPage])

  useEffect(() => {
    if (!slug || !pageId) return
    void loadAnalytics(slug, pageId)
  }, [slug, pageId, loadAnalytics])

  if (!slug || !pageId) return null

  const isLoading = pageStatus === 'idle' || pageStatus === 'loading'
  const pageAnalytics = analytics[pageId] ?? null

  const [captures, setCaptures] = useState<EmailCaptureItem[] | null>(null)
  const [capturesStatus, setCapturesStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleLoadCaptures = () => {
    if (!slug || !pageId) return
    setCapturesStatus('loading')
    listEmailCaptures(slug, pageId)
      .then((data) => { setCaptures(data); setCapturesStatus('success') })
      .catch(() => setCapturesStatus('error'))
  }

  return (
    <AppShell slug={slug} activeSection="landing-pages">
      <div className="px-8 py-8">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading…
          </div>
        ) : pageStatus === 'error' ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-neutral-950">{pageError ?? 'Something went wrong.'}</p>
            <button
              type="button"
              className="mt-4 text-sm text-neutral-500 hover:text-neutral-800"
              onClick={() => navigate(`/app/${slug}/landing-pages`)}
            >
              ← Back to landing pages
            </button>
          </div>
        ) : currentPage ? (
          <div className="grid gap-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate(`/app/${slug}/landing-pages`)}
                  className="grid size-9 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-500 shadow-sm transition hover:bg-neutral-50 hover:text-neutral-800"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
                    {currentPage.title}
                  </h1>
                  <p className="mt-0.5 text-sm text-neutral-400">/{currentPage.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentPage.status === 'Published' ? (
                  <a
                    href={`/p/${slug}/${currentPage.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 shadow-sm transition hover:bg-neutral-50"
                  >
                    <Globe size={14} />
                    View live
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate(`/app/${slug}/landing-pages/${pageId}/edit`)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  <Pencil size={14} />
                  Edit page
                </button>
              </div>
            </div>

            {/* Analytics cards */}
            {pageAnalytics === null ? (
              <div className="flex h-32 items-center justify-center gap-3 text-sm text-neutral-400">
                <Loader2 className="animate-spin" size={16} />
                Loading analytics…
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <PeriodCard label="Today" stats={pageAnalytics.today} />
                  <PeriodCard label="Last 7 days" stats={pageAnalytics.last7Days} />
                  <PeriodCard label="Last 30 days" stats={pageAnalytics.last30Days} />
                  <PeriodCard label="All time" stats={pageAnalytics.allTime} highlight />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <EmailCapturesCard total={pageAnalytics.totalEmailCaptures} />
                </div>

                {/* Email list — lazy loaded */}
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={15} className="text-neutral-400" />
                      <p className="text-sm font-semibold text-neutral-950">Captured emails</p>
                    </div>
                    {capturesStatus === 'idle' ? (
                      <button
                        type="button"
                        onClick={handleLoadCaptures}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
                      >
                        <ChevronDown size={13} />
                        Show emails
                      </button>
                    ) : null}
                  </div>

                  {capturesStatus === 'idle' ? (
                    <div className="flex items-center justify-center py-10 text-sm text-neutral-400">
                      Click "Show emails" to load the list
                    </div>
                  ) : capturesStatus === 'loading' ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-400">
                      <Loader2 className="animate-spin" size={15} />
                      Loading…
                    </div>
                  ) : capturesStatus === 'error' ? (
                    <div className="flex items-center justify-center py-10 text-sm text-red-500">
                      Failed to load. Try again.
                    </div>
                  ) : captures !== null && captures.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-neutral-400">
                      No emails captured yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-neutral-100">
                      {captures?.map((c) => (
                        <li key={c.email} className="flex items-center justify-between px-5 py-3">
                          <span className="text-sm text-neutral-950">{c.email}</span>
                          <span className="text-xs text-neutral-400">
                            {new Date(c.capturedAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function EmailCapturesCard({ total }: { total: number }) {
  const count = total ?? 0
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Email captures</p>
      <div className="mt-4 flex items-center gap-2">
        <Mail size={14} className="text-neutral-400" />
        <span className="text-2xl font-bold tabular-nums text-neutral-950">{count.toLocaleString()}</span>
        <span className="text-xs text-neutral-400">unique emails</span>
      </div>
    </div>
  )
}

function PeriodCard({
  label,
  stats,
  highlight = false,
}: {
  label: string
  stats: PeriodStats
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? 'border-neutral-950 bg-neutral-950'
          : 'border-neutral-200 bg-white'
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-widest ${highlight ? 'text-white/50' : 'text-neutral-400'}`}>
        {label}
      </p>
      <div className="mt-4 grid gap-3">
        <div className="flex items-center gap-2">
          <Eye size={14} className={highlight ? 'text-white/60' : 'text-neutral-400'} />
          <span className={`text-2xl font-bold tabular-nums ${highlight ? 'text-white' : 'text-neutral-950'}`}>
            {stats.totalViews.toLocaleString()}
          </span>
          <span className={`text-xs ${highlight ? 'text-white/40' : 'text-neutral-400'}`}>views</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className={highlight ? 'text-white/60' : 'text-neutral-400'} />
          <span className={`text-2xl font-bold tabular-nums ${highlight ? 'text-white' : 'text-neutral-950'}`}>
            {stats.uniqueVisitors.toLocaleString()}
          </span>
          <span className={`text-xs ${highlight ? 'text-white/40' : 'text-neutral-400'}`}>unique</span>
        </div>
      </div>
    </div>
  )
}
