import {
  Banknote,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { useCreatorStore } from '../../features/creators/model/creator-store'
import { useThemeStore } from '../model/theme-store'

type NavSection = 'overview' | 'landing-pages' | 'products' | 'orders' | 'emails' | 'subscribers' | 'payouts' | 'settings'

type AppShellProps = {
  slug: string
  activeSection: NavSection
  children: ReactNode
}

const navItems: { section: NavSection; label: string; icon: typeof LayoutDashboard; href: (slug: string) => string }[] = [
  { section: 'overview',       label: 'Overview',       icon: LayoutDashboard, href: (s) => `/app/${s}` },
  { section: 'landing-pages',  label: 'Landing Pages',  icon: FileText,        href: (s) => `/app/${s}/landing-pages` },
  { section: 'products',       label: 'Products',       icon: Package,         href: (s) => `/app/${s}/products` },
  { section: 'orders',         label: 'Orders',         icon: ShoppingBag,     href: (s) => `/app/${s}/orders` },
  { section: 'emails',         label: 'Emails',         icon: Mail,            href: (s) => `/app/${s}/emails` },
  { section: 'subscribers',    label: 'Subscribers',    icon: Users,           href: (s) => `/app/${s}/subscribers` },
  { section: 'payouts',        label: 'Payouts',        icon: Banknote,        href: (s) => `/app/${s}/payouts` },
]

export function AppShell({ slug, activeSection, children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const logoutStatus = useAuthStore((s) => s.logoutStatus)
  const isLoggingOut = logoutStatus === 'submitting'
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
    : ''

  void location // used implicitly via activeSection

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Subtle grid texture */}
      <div className="bg-grid pointer-events-none fixed inset-0 opacity-[0.04]" />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <span className="grid size-7 place-items-center rounded-lg bg-accent">
            <span className="font-display text-sm font-bold text-white">CP</span>
          </span>
          <span className="font-display text-lg font-bold tracking-widest text-sidebar-foreground">
            CREATOR
          </span>
        </div>

        {/* Creator identity */}
        {creator && (
          <div className="relative overflow-hidden border-b border-sidebar-border px-5 py-4">
            <div className="animate-glow-pulse pointer-events-none absolute -left-8 -top-8 size-24 rounded-full bg-accent/25 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent shadow-lg shadow-black/20">
                <span className="font-display text-sm font-black tracking-tighter text-white">
                  {creator.name[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-bold leading-tight text-sidebar-foreground">
                  {creator.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <StatusDot status={creator.status} />
                  <span className="truncate font-mono text-[10.5px] text-muted-foreground">/{slug}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <ul className="space-y-0.5">
            {navItems.map(({ section, label, icon: Icon, href }) => {
              const isActive = activeSection === section
              return (
                <li key={section}>
                  <button
                    type="button"
                    onClick={() => navigate(href(slug))}
                    className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                      isActive
                        ? 'bg-accent/[0.12] font-medium text-accent'
                        : 'text-muted-foreground hover:text-sidebar-foreground'
                    }`}
                  >
                    {isActive ? (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
                    ) : null}
                    <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                    {label}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="my-4 border-t border-sidebar-border" />

          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => navigate(`/app/${slug}/settings`)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                  activeSection === 'settings'
                    ? 'bg-accent/[0.12] font-medium text-accent'
                    : 'text-muted-foreground hover:text-sidebar-foreground'
                }`}
              >
                {activeSection === 'settings' ? (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
                ) : null}
                <Settings size={15} strokeWidth={activeSection === 'settings' ? 2.2 : 1.8} />
                Settings
              </button>
            </li>
            {user?.roles?.includes('platform_admin') ? (
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/admin/payouts')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-all hover:text-sidebar-foreground"
                >
                  <ShieldCheck size={15} strokeWidth={1.8} />
                  Admin payouts
                </button>
              </li>
            ) : null}
          </ul>
        </nav>

        {/* Footer — user */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2.5">
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">{fullName}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email ?? ''}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:text-sidebar-foreground"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <span className="relative h-4 w-7 shrink-0 rounded-full bg-sidebar-accent transition-colors">
              <span
                className={`absolute top-0.5 size-3 rounded-full bg-accent transition-all ${
                  theme === 'dark' ? 'left-0.5' : 'left-3.5'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => void logout()}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:text-sidebar-foreground disabled:opacity-40"
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
      <div className="relative z-10 ml-56 flex min-h-screen flex-1 flex-col">
        {children}
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const s = status.toLowerCase()
  const color =
    s === 'active' ? 'bg-emerald-500' : s === 'pendingpayment' ? 'bg-amber-500' : s === 'suspended' ? 'bg-red-500' : 'bg-white/30'
  return <span className={`size-1.5 shrink-0 rounded-full ${color}`} />
}
