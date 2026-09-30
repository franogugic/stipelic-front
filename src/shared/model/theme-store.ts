import { create } from 'zustand'

export type Theme = 'dark' | 'light'

type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

// Written only when the user picks a theme themselves; until then the OS preference decides.
const STORAGE_KEY = 'luma.theme'

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked (private mode); the theme still applies for this session.
  }
}

function applyThemeToDocument(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  // The inline script in index.html has already set data-theme before the first paint.
  theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  setTheme: (theme) => {
    if (theme === get().theme) return
    storeTheme(theme)
    applyThemeToDocument(theme)
    set({ theme })
  },
  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
  },
}))

// Follow the OS while the user has not chosen a theme themselves.
systemDark.addEventListener('change', (event) => {
  if (readStoredTheme()) return
  const theme: Theme = event.matches ? 'dark' : 'light'
  applyThemeToDocument(theme)
  useThemeStore.setState({ theme })
})
