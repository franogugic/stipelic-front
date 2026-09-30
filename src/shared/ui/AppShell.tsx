import { Menu } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Brand, Button, ThemeToggleButton } from './ledger'
import { NAV_SECTION_LABELS } from './nav-sections'
import type { NavSection } from './nav-sections'
import { Sidebar } from './Sidebar'
import { WorkspaceBanners } from './WorkspaceBanners'

type AppShellProps = {
  slug: string
  activeSection: NavSection
  children: ReactNode
}

const DESKTOP_QUERY = '(min-width: 1024px)'

/**
 * The Ledger app chrome: skip link, sidebar, mobile topbar + drawer, banner area and the page container.
 * Below 1024 px the sidebar is a drawer: opening it makes the canvas inert and focuses the current link;
 * Esc, the backdrop, the close button, a route change and growing past 1024 px close it.
 */
export function AppShell({ slug, activeSection, children }: AppShellProps) {
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerPath, setDrawerPath] = useState(pathname)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const restoreFocus = useRef(false)

  // The SPA has no page reload, so a route change has to close the drawer itself (no focus restore).
  if (pathname !== drawerPath) {
    setDrawerPath(pathname)
    if (drawerOpen) setDrawerOpen(false)
  }

  const closeDrawer = useCallback((restore = true) => {
    restoreFocus.current = restore
    setDrawerOpen(false)
  }, [])

  // Focus moves into the sidebar when the drawer opens, and back to the menu button when it closes.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (drawerOpen && !wasOpen.current) {
      const sidebar = sidebarRef.current
      const target = sidebar?.querySelector<HTMLElement>('[aria-current="page"]') ?? sidebar?.querySelector<HTMLElement>('a, button')
      target?.focus()
    } else if (!drawerOpen && wasOpen.current && restoreFocus.current) {
      menuButtonRef.current?.focus()
    }
    wasOpen.current = drawerOpen
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen, closeDrawer])

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeDrawer(false)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [closeDrawer])

  useEffect(() => {
    document.title = `${NAV_SECTION_LABELS[activeSection]} · Luma`
  }, [activeSection])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="app" data-drawer={drawerOpen ? 'open' : undefined}>
        <aside className="app-sidebar" id="app-sidebar" aria-label="Sidebar" ref={sidebarRef}>
          <Sidebar slug={slug} activeSection={activeSection} onCloseDrawer={() => closeDrawer()} />
        </aside>

        <div className="app-canvas" inert={drawerOpen}>
          <header className="app-topbar">
            <Button
              ref={menuButtonRef}
              variant="ghost"
              iconOnly
              icon={Menu}
              aria-controls="app-sidebar"
              aria-expanded={drawerOpen}
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            />
            <Brand to={`/app/${slug}`} />
            <div className="app-topbar__end">
              <ThemeToggleButton />
            </div>
          </header>
          <div className="app-banners">
            <WorkspaceBanners slug={slug} />
          </div>
          <main className="page" id="main" tabIndex={-1}>
            {children}
          </main>
        </div>

        <div className="drawer-backdrop" onClick={() => closeDrawer()} />
      </div>
    </>
  )
}
