import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Settings,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'

type NavSection = 'overview' | 'landing-pages' | 'products' | 'analytics' | 'settings'

type AppShellProps = {
  slug: string
  activeSection: NavSection
  children: ReactNode
}

const navItems: { section: NavSection; label: string; icon: typeof LayoutDashboard; href: (slug: string) => string }[] = [
  { section: 'overview',       label: 'Overview',       icon: LayoutDashboard, href: (s) => `/app/${s}` },
  { section: 'landing-pages',  label: 'Landing Pages',  icon: FileText,        href: (s) => `/app/${s}/landing-pages` },
  { section: 'products',       label: 'Products',       icon: Package,         href: (s) => `/app/${s}/products` },
  { section: 'analytics',      label: 'Analytics',      icon: BarChart3,       href: (s) => `/app/${s}/analytics` },
]

export function AppShell({ slug, activeSection, children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const logoutStatus = useAuthStore((s) => s.logoutStatus)
  const isLoggingOut = logoutStatus === 'submitting'

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
    : ''

  void location // used implicitly via activeSection

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-neutral-950">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <span className="grid size-8 place-items-center rounded-lg bg-white text-neutral-950">
            <span className="text-xs font-black tracking-tight">CP</span>
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Creator Platform</p>
            <p className="text-[11px] text-white/40">/{slug}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Workspace
          </p>
          <ul className="grid gap-0.5">
            {navItems.map(({ section, label, icon: Icon, href }) => {
              const isActive = activeSection === section
              return (
                <li key={section}>
                  <button
                    type="button"
                    onClick={() => navigate(href(slug))}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white text-neutral-950'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                    {label}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="my-4 border-t border-white/10" />

          <ul className="grid gap-0.5">
            <li>
              <button
                type="button"
                onClick={() => navigate(`/app/${slug}/settings`)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  activeSection === 'settings'
                    ? 'bg-white text-neutral-950'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings size={16} strokeWidth={activeSection === 'settings' ? 2.2 : 1.8} />
                Settings
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer — user */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{fullName}</p>
              <p className="truncate text-[11px] text-white/40">{user?.email ?? ''}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => void logout()}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            {isLoggingOut ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <LogOut size={15} />
            )}
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-60 flex min-h-screen flex-1 flex-col">
        {children}
      </div>
    </div>
  )
}
