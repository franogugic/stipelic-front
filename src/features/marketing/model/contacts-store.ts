import { create } from 'zustand'
import { searchContacts } from '../api/contacts-api'
import type { Contact } from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

const PAGE_SIZE = 10

type ContactsState = {
  contacts: Contact[]
  contactsStatus: LoadStatus
  hasMore: boolean
  loadMoreStatus: LoadStatus
  search: string
  contactsSlug: string | null

  loadContacts: (slug: string, search?: string) => Promise<void>
  loadMoreContacts: (slug: string) => Promise<void>
  setSearch: (search: string) => void
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  contactsStatus: 'idle',
  hasMore: false,
  loadMoreStatus: 'idle',
  search: '',
  contactsSlug: null,

  loadContacts: async (slug, search = '') => {
    set({ contactsStatus: 'loading', search, contactsSlug: slug })
    try {
      const page = await searchContacts(slug, { search: search || undefined, limit: PAGE_SIZE })
      set({ contacts: page.contacts, hasMore: page.hasMore, contactsStatus: 'success' })
    } catch {
      set({ contacts: [], hasMore: false, contactsStatus: 'error' })
    }
  },

  loadMoreContacts: async (slug) => {
    const { contacts, search, loadMoreStatus } = get()
    if (loadMoreStatus === 'loading' || contacts.length === 0) return

    set({ loadMoreStatus: 'loading' })
    try {
      const afterEmail = contacts[contacts.length - 1].email
      const page = await searchContacts(slug, { search: search || undefined, afterEmail, limit: PAGE_SIZE })
      set({
        contacts: [...contacts, ...page.contacts],
        hasMore: page.hasMore,
        loadMoreStatus: 'success',
      })
    } catch {
      set({ loadMoreStatus: 'error' })
    }
  },

  setSearch: (search) => {
    set({ search })
  },
}))
