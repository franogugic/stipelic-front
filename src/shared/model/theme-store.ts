import { create } from 'zustand'

export type Theme = 'dark' | 'light'

type ThemeState = {
  theme: Theme
  // With an origin element the new theme grows out of it as a circle (View Transitions API).
  setTheme: (theme: Theme, origin?: Element | null) => void
  toggleTheme: (origin?: Element | null) => void
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

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Runs the switch inside a view transition and reveals the new theme as a growing circle from the origin.
function switchThemeAnimated(apply: () => void, origin?: Element | null) {
  const rect = origin ? origin.getBoundingClientRect() : null
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const y = rect ? rect.top + rect.height / 2 : 0
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const transition = document.startViewTransition(apply)
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {
      // Transition skipped — the theme is already applied.
    })
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  // The inline script in index.html has already set data-theme before the first paint.
  theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  setTheme: (theme, origin) => {
    if (theme === get().theme) return
    storeTheme(theme)
    const apply = () => {
      applyThemeToDocument(theme)
      set({ theme })
    }
    if (!document.startViewTransition || prefersReducedMotion()) {
      apply()
      return
    }
    switchThemeAnimated(apply, origin)
  },
  toggleTheme: (origin) => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark', origin)
  },
}))

// Follow the OS while the user has not chosen a theme themselves.
systemDark.addEventListener('change', (event) => {
  if (readStoredTheme()) return
  const theme: Theme = event.matches ? 'dark' : 'light'
  applyThemeToDocument(theme)
  useThemeStore.setState({ theme })
})
