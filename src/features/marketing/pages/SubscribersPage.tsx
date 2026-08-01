import { Loader2, Search, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useContactsStore } from '../model/contacts-store'

const CONTACTS_SEARCH_DEBOUNCE_MS = 350

export function SubscribersPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const normalizedSlug = slug ?? ''

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creator = currentCreator?.slug === normalizedSlug ? currentCreator : null

  const isLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="subscribers">
      <div className="px-8 py-8">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading workspace…
          </div>
        ) : !creator ? (
          <div className="rounded-2xl border border-border bg-card p-8 backdrop-blur-sm light:shadow-sm">
            <p className="font-semibold text-white light:text-neutral-950">Workspace not found</p>
            <button
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-white/70 transition hover:bg-secondary light:text-neutral-600"
              type="button"
              onClick={() => navigate('/')}
            >
              Go home
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            <div>
              <h1 className="font-display text-3xl font-bold leading-none text-white light:text-neutral-950">Subscribers</h1>
              <p className="mt-1.5 text-sm text-white/40 light:text-neutral-400">
                Everyone who has signed up on one of your landing pages.
              </p>
            </div>

            <ContactsList slug={normalizedSlug} />
          </div>
        )}
      </div>
    </AppShell>
  )
}

function ContactsList({ slug }: { slug: string }) {
  const [searchInput, setSearchInput] = useState('')

  const contacts = useContactsStore((s) => s.contacts)
  const contactsStatus = useContactsStore((s) => s.contactsStatus)
  const hasMore = useContactsStore((s) => s.hasMore)
  const loadMoreStatus = useContactsStore((s) => s.loadMoreStatus)
  const loadContacts = useContactsStore((s) => s.loadContacts)
  const loadMoreContacts = useContactsStore((s) => s.loadMoreContacts)

  useEffect(() => {
    const handle = setTimeout(() => {
      void loadContacts(slug, searchInput.trim())
    }, CONTACTS_SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, searchInput])

  return (
    <div className="grid gap-6">
      <div className="relative max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 light:text-neutral-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by email…"
          className="h-10 w-full rounded-xl border border-border bg-secondary pl-10 pr-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:text-neutral-950 light:placeholder-neutral-400"
        />
      </div>

      {contactsStatus === 'loading' ? (
        <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
          <Loader2 className="animate-spin" size={16} />
          Loading contacts…
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 bg-card py-20 text-center light:border-neutral-300">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-white/40 light:bg-neutral-100 light:text-neutral-400">
            <Users size={24} strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white light:text-neutral-950">
              {searchInput.trim() ? 'No contacts match your search' : 'No contacts yet'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-white/40 light:text-neutral-400">
              {searchInput.trim()
                ? 'Try a different email or clear the search.'
                : 'Contacts appear here once someone signs up on one of your landing pages.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm light:shadow-sm">
            <div className="grid grid-cols-[1fr_1.4fr_160px_140px] items-center border-b border-border px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Email</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Sources</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">First captured</p>
              <span />
            </div>
            <ul className="divide-y divide-white/10 light:divide-neutral-100">
              {contacts.map((contact) => (
                <li key={contact.email} className="transition-colors hover:bg-secondary/60">
                  <div className="grid grid-cols-[1fr_1.4fr_140px_140px] items-center px-5 py-4">
                    <p className="truncate text-sm font-medium text-white light:text-neutral-950">{contact.email}</p>
                    <p className="truncate text-xs text-white/60 light:text-neutral-600">
                      {contact.sourcesCount} {contact.sourcesCount === 1 ? 'source' : 'sources'}
                      {contact.sources ? ` · ${contact.sources}` : ''}
                    </p>
                    <p className="text-xs text-white/50 light:text-neutral-500">
                      {new Date(contact.firstCapturedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    {contact.isUnsubscribed ? (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/50 light:bg-neutral-100 light:text-neutral-500">
                        Unsubscribed
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {hasMore ? (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loadMoreStatus === 'loading'}
                onClick={() => void loadMoreContacts(slug)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-white/70 transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 light:text-neutral-600"
              >
                {loadMoreStatus === 'loading' ? <Loader2 className="animate-spin" size={14} /> : null}
                Load more
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
